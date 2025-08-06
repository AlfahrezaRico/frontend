
-- Enable RLS on attendance_records table if not already enabled
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to attendance_records
-- This allows HRD to view all attendance records
CREATE POLICY "Allow public read access to attendance_records" 
ON public.attendance_records 
FOR SELECT 
USING (true);

-- Create policy to allow public insert access to attendance_records
-- This allows employees to submit attendance records
CREATE POLICY "Allow public insert access to attendance_records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow public update access to attendance_records
-- This allows HRD to update attendance records
CREATE POLICY "Allow public update access to attendance_records" 
ON public.attendance_records 
FOR UPDATE 
USING (true);

-- Create policy to allow public delete access to attendance_records
-- This allows deleting attendance records if needed
CREATE POLICY "Allow public delete access to attendance_records" 
ON public.attendance_records 
FOR DELETE 
USING (true);
