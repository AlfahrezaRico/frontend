
-- Enable RLS on leave_requests table if not already enabled
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to leave_requests
-- This allows HRD to view all leave requests
CREATE POLICY "Allow public read access to leave_requests" 
ON public.leave_requests 
FOR SELECT 
USING (true);

-- Create policy to allow public insert access to leave_requests
-- This allows employees to submit leave requests
CREATE POLICY "Allow public insert access to leave_requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow public update access to leave_requests
-- This allows HRD to approve/reject leave requests
CREATE POLICY "Allow public update access to leave_requests" 
ON public.leave_requests 
FOR UPDATE 
USING (true);

-- Create policy to allow public delete access to leave_requests
-- This allows deleting leave requests if needed
CREATE POLICY "Allow public delete access to leave_requests" 
ON public.leave_requests 
FOR DELETE 
USING (true);
