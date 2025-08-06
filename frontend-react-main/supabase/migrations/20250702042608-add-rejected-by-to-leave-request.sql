-- Add rejected_by and rejected_at columns to leave_requests table
ALTER TABLE leave_requests
ADD COLUMN rejected_by UUID NULL,
ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE NULL;

-- Add foreign key constraint for rejected_by
ALTER TABLE leave_requests
ADD CONSTRAINT fk_leave_requests_rejected_by
FOREIGN KEY (rejected_by) REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN leave_requests.rejected_by IS 'UUID of user who rejected the leave request';
COMMENT ON COLUMN leave_requests.rejected_at IS 'Timestamp when the leave request was rejected'; 