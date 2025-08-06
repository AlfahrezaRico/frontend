-- Create NIK configuration table per department
-- Konfigurasi NIK yang berelasi dengan departemen

-- Create department_nik_config table
CREATE TABLE public.department_nik_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES public.employees(id), -- Relasi ke departemen
    department_name VARCHAR(100) NOT NULL, -- Nama departemen
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

-- Insert default configurations for common departments
INSERT INTO public.department_nik_config (department_name, prefix, current_sequence, sequence_length, format_pattern, separator, is_active) VALUES
('IT', 'IT', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('HR', 'HR', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('Finance', 'FN', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('Marketing', 'MK', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('Operations', 'OPS', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('Sales', 'SL', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true),
('General', 'EMP', 1, 3, '{PREFIX}{SEQUENCE}{SEPARATOR}', '---', true);

-- Enable RLS
ALTER TABLE public.department_nik_config ENABLE ROW LEVEL SECURITY;

-- Create policies for department NIK configuration (only super admin can access)
CREATE POLICY "Super admin can manage department NIK configuration" ON public.department_nik_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'Super Admin'
  )
);

-- Create trigger to update updated_at timestamp
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
    next_nik := REPLACE(
        REPLACE(
            REPLACE(
                config_record.format_pattern,
                '{PREFIX}', config_record.prefix
            ),
            '{SEQUENCE}',
            LPAD(config_record.current_sequence::TEXT, config_record.sequence_length, '0')
        ),
        '{SEPARATOR}',
        config_record.separator
    );

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

-- Create function to get all department configurations
CREATE OR REPLACE FUNCTION get_department_nik_configs()
RETURNS TABLE (
    id UUID,
    department_name VARCHAR,
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
        dnc.department_name,
        dnc.prefix,
        dnc.current_sequence,
        dnc.sequence_length,
        dnc.format_pattern,
        dnc.separator,
        dnc.is_active,
        dnc.created_at,
        dnc.updated_at
    FROM department_nik_config dnc
    ORDER BY dnc.department_name;
END;
$$ LANGUAGE plpgsql; 