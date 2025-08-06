-- Create NIK configuration table for auto-generation settings
CREATE TABLE public.nik_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prefix VARCHAR(10) NOT NULL DEFAULT 'EMP',
    current_sequence INTEGER NOT NULL DEFAULT 1,
    sequence_length INTEGER NOT NULL DEFAULT 5,
    format_pattern VARCHAR(50) NOT NULL DEFAULT '{PREFIX}{SEQUENCE}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default configuration
INSERT INTO public.nik_configuration (prefix, current_sequence, sequence_length, format_pattern, created_by) 
VALUES ('EMP', 1, 5, '{PREFIX}{SEQUENCE}', NULL);

-- Enable RLS
ALTER TABLE public.nik_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies for NIK configuration (only super admin can access)
CREATE POLICY "Super admin can manage NIK configuration" ON public.nik_configuration
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Super Admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_nik_configuration_updated_at
    BEFORE UPDATE ON public.nik_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate next NIK
CREATE OR REPLACE FUNCTION generate_next_nik()
RETURNS VARCHAR AS $$
DECLARE
    next_nik VARCHAR;
    config_record RECORD;
BEGIN
    -- Get the current configuration
    SELECT * INTO config_record FROM nik_configuration WHERE is_active = true LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active NIK configuration found';
    END IF;
    
    -- Generate next NIK
    next_nik := REPLACE(
        REPLACE(
            config_record.format_pattern,
            '{PREFIX}', config_record.prefix
        ),
        '{SEQUENCE}', 
        LPAD(config_record.current_sequence::TEXT, config_record.sequence_length, '0')
    );
    
    -- Update the sequence
    UPDATE nik_configuration 
    SET current_sequence = current_sequence + 1,
        updated_at = now()
    WHERE id = config_record.id;
    
    RETURN next_nik;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate NIK format
CREATE OR REPLACE FUNCTION validate_nik_format(nik_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if NIK follows the configured format
    RETURN nik_input ~ '^[A-Z]{3}[0-9]{5}$';
END;
$$ LANGUAGE plpgsql; 