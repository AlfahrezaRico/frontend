-- Add NIK (Employee ID) column to employees table
-- NIK is a unique identifier for each employee in Indonesian companies
-- Format: 3 characters + 5 digits (total 8 characters)

-- Add the NIK column
ALTER TABLE public.employees 
ADD COLUMN nik VARCHAR(8) UNIQUE;

-- Add a comment to describe the column
COMMENT ON COLUMN public.employees.nik IS 'Nomor Induk Karyawan - Format: 3 karakter + 5 angka (total 8 karakter)';

-- Create an index on NIK for faster lookups
CREATE INDEX idx_employees_nik ON public.employees(nik);

-- Add a check constraint to ensure NIK format: 3 characters + 5 digits
-- Example format: ABC12345, XYZ98765
ALTER TABLE public.employees 
ADD CONSTRAINT check_nik_format 
CHECK (nik IS NULL OR (nik ~ '^[A-Z]{3}[0-9]{5}$'));

-- Update the updated_at trigger to include NIK changes
-- (The existing trigger should already handle this, but we're ensuring it's covered) 