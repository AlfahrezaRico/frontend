-- Create NIK configuration table per department with proper relation
-- Konfigurasi NIK yang berelasi dengan tabel departemen

-- First, let's check if departments table exists, if not create it
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create department_nik_config table with proper relation
CREATE TABLE public.department_nik_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    department_name VARCHAR(100) NOT NULL, -- Nama departemen (for backward compatibility)
    prefix VARCHAR(10) NOT NULL DEFAULT 'EMP',
    current_sequence INTEGER NOT NULL DEFAULT 1,
    sequence_length INTEGER NOT NULL DEFAULT 3,
    format_pattern VARCHAR(50) NOT NULL DEFAULT '{PREFIX}{SEQUENCE}{SEPARATOR}',
    separator VARCHAR(5) DEFAULT '---', -- Separator seperti strip
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default departments if they don't exist
INSERT INTO public.departments (name, description) VALUES
('IT', 'Information Technology Department'),
('HR', 'Human Resources Department'),
('Finance', 'Finance Department'),
('Marketing', 'Marketing Department'),
('Operations', 'Operations Department'),
('Sales', 'Sales Department'),
('General', 'General Department')
ON CONFLICT (name) DO NOTHING;

-- Insert default configurations for common departments
INSERT INTO public.department_nik_config (department_id, department_name, prefix, current_sequence, sequence_length, format_pattern, separator, is_active) 
SELECT 
    d.id,
    d.name,
    CASE 
        WHEN d.name = 'IT' THEN 'IT'
        WHEN d.name = 'HR' THEN 'HR'
        WHEN d.name = 'Finance' THEN 'FN'
        WHEN d.name = 'Marketing' THEN 'MK'
        WHEN d.name = 'Operations' THEN 'OPS'
        WHEN d.name = 'Sales' THEN 'SL'
        ELSE 'EMP'
    END,
    1,
    3,
    '{PREFIX}{SEQUENCE}{SEPARATOR}',
    '---',
    true
FROM public.departments d
WHERE d.name IN ('IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'General')
ON CONFLICT (department_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_nik_config ENABLE ROW LEVEL SECURITY;

-- Create policies for departments (only super admin can access)
CREATE POLICY "Super admin can manage departments" ON public.departments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Super Admin'
  )
);

-- Create policies for department NIK configuration (only super admin can access)
CREATE POLICY "Super admin can manage department NIK configuration" ON public.department_nik_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Super Admin'
  )
);

-- Create trigger to update updated_at timestamp for departments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at timestamp for department_nik_config
CREATE TRIGGER update_department_nik_config_updated_at
    BEFORE UPDATE ON public.department_nik_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate next NIK for specific department
CREATE OR REPLACE FUNCTION generate_next_nik_for_department(department_name_input VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_nik VARCHAR;
    config_record RECORD;
BEGIN
    -- Get the configuration for the specific department
    SELECT * INTO config_record FROM department_nik_config 
    WHERE department_name = department_name_input AND is_active = true 
    LIMIT 1;

    IF NOT FOUND THEN
        -- Fallback to general configuration
        SELECT * INTO config_record FROM department_nik_config 
        WHERE department_name = 'General' AND is_active = true 
        LIMIT 1;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No active NIK configuration found for department % or general', department_name_input;
        END IF;
    END IF;

    -- Generate next NIK with separator
    next_nik := config_record.prefix || 
                 LPAD(config_record.current_sequence::TEXT, config_record.sequence_length, '0') || 
                 config_record.separator;

    -- Update the sequence
    UPDATE department_nik_config
    SET current_sequence = current_sequence + 1,
        updated_at = now()
    WHERE id = config_record.id;

    RETURN next_nik;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate NIK format for department
CREATE OR REPLACE FUNCTION validate_nik_format_for_department(nik_input VARCHAR, department_name_input VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    config_record RECORD;
    expected_pattern VARCHAR;
BEGIN
    -- Get the configuration for the specific department
    SELECT * INTO config_record FROM department_nik_config 
    WHERE department_name = department_name_input AND is_active = true 
    LIMIT 1;

    IF NOT FOUND THEN
        -- Fallback to general configuration
        SELECT * INTO config_record FROM department_nik_config 
        WHERE department_name = 'General' AND is_active = true 
        LIMIT 1;
    END IF;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if NIK follows the configured format with separator
    expected_pattern := '^' || config_record.prefix || '[0-9]{' || config_record.sequence_length || '}' || config_record.separator || '$';
    RETURN nik_input ~ expected_pattern;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all department configurations with department info
CREATE OR REPLACE FUNCTION get_department_nik_configs_with_info()
RETURNS TABLE (
    id UUID,
    department_id UUID,
    department_name VARCHAR,
    department_description TEXT,
    prefix VARCHAR,
    current_sequence INTEGER,
    sequence_length INTEGER,
    format_pattern VARCHAR,
    separator VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dnc.id,
        dnc.department_id,
        dnc.department_name,
        d.description as department_description,
        dnc.prefix,
        dnc.current_sequence,
        dnc.sequence_length,
        dnc.format_pattern,
        dnc.separator,
        dnc.is_active,
        dnc.created_at,
        dnc.updated_at
    FROM department_nik_config dnc
    LEFT JOIN departments d ON dnc.department_id = d.id
    ORDER BY dnc.department_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all departments with their NIK config status
CREATE OR REPLACE FUNCTION get_departments_with_nik_status()
RETURNS TABLE (
    department_id UUID,
    department_name VARCHAR,
    department_description TEXT,
    has_nik_config BOOLEAN,
    nik_config_active BOOLEAN,
    current_prefix VARCHAR,
    current_sequence INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as department_id,
        d.name as department_name,
        d.description as department_description,
        CASE WHEN dnc.id IS NOT NULL THEN true ELSE false END as has_nik_config,
        COALESCE(dnc.is_active, false) as nik_config_active,
        COALESCE(dnc.prefix, '') as current_prefix,
        COALESCE(dnc.current_sequence, 0) as current_sequence
    FROM departments d
    LEFT JOIN department_nik_config dnc ON d.id = dnc.department_id
    ORDER BY d.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to create NIK config for a department
CREATE OR REPLACE FUNCTION create_nik_config_for_department(
    p_department_id UUID,
    p_prefix VARCHAR DEFAULT NULL,
    p_sequence_length INTEGER DEFAULT 3,
    p_separator VARCHAR DEFAULT '---'
)
RETURNS UUID AS $$
DECLARE
    v_department_name VARCHAR;
    v_prefix VARCHAR;
    v_config_id UUID;
BEGIN
    -- Get department name
    SELECT name INTO v_department_name FROM departments WHERE id = p_department_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Department not found';
    END IF;

    -- Set default prefix based on department name if not provided
    IF p_prefix IS NULL THEN
        v_prefix := CASE 
            WHEN v_department_name = 'IT' THEN 'IT'
            WHEN v_department_name = 'HR' THEN 'HR'
            WHEN v_department_name = 'Finance' THEN 'FN'
            WHEN v_department_name = 'Marketing' THEN 'MK'
            WHEN v_department_name = 'Operations' THEN 'OPS'
            WHEN v_department_name = 'Sales' THEN 'SL'
            ELSE 'EMP'
        END;
    ELSE
        v_prefix := p_prefix;
    END IF;

    -- Insert new configuration
    INSERT INTO department_nik_config (
        department_id,
        department_name,
        prefix,
        current_sequence,
        sequence_length,
        format_pattern,
        separator,
        is_active
    ) VALUES (
        p_department_id,
        v_department_name,
        v_prefix,
        1,
        p_sequence_length,
        '{PREFIX}{SEQUENCE}{SEPARATOR}',
        p_separator,
        true
    ) RETURNING id INTO v_config_id;

    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.departments IS 'Tabel untuk menyimpan data departemen perusahaan';
COMMENT ON TABLE public.department_nik_config IS 'Tabel untuk konfigurasi NIK per departemen dengan relasi ke tabel departments';
COMMENT ON COLUMN public.department_nik_config.separator IS 'Separator untuk format NIK (contoh: ---, ###, ___)';
COMMENT ON FUNCTION generate_next_nik_for_department(VARCHAR) IS 'Generate NIK berikutnya untuk departemen tertentu dengan format: PREFIX + SEQUENCE + SEPARATOR'; 