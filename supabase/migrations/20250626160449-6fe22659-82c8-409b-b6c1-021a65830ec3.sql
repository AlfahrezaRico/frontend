
-- Enable RLS on employees table if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to employees
-- This allows HRD dashboard to display employee data
CREATE POLICY "Allow public read access to employees" 
ON public.employees 
FOR SELECT 
USING (true);

-- Create policy to allow public insert access to employees
-- This allows adding new employees from the dashboard
CREATE POLICY "Allow public insert access to employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow public update access to employees
-- This allows updating employee data from the dashboard
CREATE POLICY "Allow public update access to employees" 
ON public.employees 
FOR UPDATE 
USING (true);

-- Create policy to allow public delete access to employees
-- This allows deleting employees from the dashboard
CREATE POLICY "Allow public delete access to employees" 
ON public.employees 
FOR DELETE 
USING (true);
