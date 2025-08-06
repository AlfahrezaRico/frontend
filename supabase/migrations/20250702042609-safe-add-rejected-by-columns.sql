-- Safely add rejected_by and rejected_at columns to leave_requests table
-- This migration checks if columns exist before adding them

-- Add rejected_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'rejected_by'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN rejected_by UUID NULL;
    END IF;
END $$;

-- Add rejected_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' 
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE leave_requests ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_leave_requests_rejected_by'
    ) THEN
        ALTER TABLE leave_requests
        ADD CONSTRAINT fk_leave_requests_rejected_by
        FOREIGN KEY (rejected_by) REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add comments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'leave_requests'::regclass 
        AND objsubid = (
            SELECT ordinal_position 
            FROM information_schema.columns 
            WHERE table_name = 'leave_requests' 
            AND column_name = 'rejected_by'
        )
    ) THEN
        COMMENT ON COLUMN leave_requests.rejected_by IS 'UUID of user who rejected the leave request';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'leave_requests'::regclass 
        AND objsubid = (
            SELECT ordinal_position 
            FROM information_schema.columns 
            WHERE table_name = 'leave_requests' 
            AND column_name = 'rejected_at'
        )
    ) THEN
        COMMENT ON COLUMN leave_requests.rejected_at IS 'Timestamp when the leave request was rejected';
    END IF;
END $$; 