-- Create system_logs table for tracking system activities
CREATE TABLE public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'INFO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create system_settings table for storing configuration
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create backup_history table for database backup tracking
CREATE TABLE public.backup_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT,
  backup_type VARCHAR(50) DEFAULT 'manual',
  status VARCHAR(50) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Create policies for system_logs (only super admin can access)
CREATE POLICY "Super admin can view all system logs" ON public.system_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Super Admin'
  )
);

-- Create policies for system_settings (only super admin can access)
CREATE POLICY "Super admin can manage system settings" ON public.system_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Super Admin'
  )
);

-- Create policies for backup_history (only super admin can access)
CREATE POLICY "Super admin can manage backup history" ON public.backup_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Super Admin'
  )
);

-- Insert sample system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'PT. HRIS Pro Indonesia', 'string', 'Nama perusahaan'),
('company_email', 'admin@hris-pro.com', 'email', 'Email perusahaan'),
('timezone', 'Asia/Jakarta', 'string', 'Zona waktu sistem'),
('work_hours_per_day', '8', 'number', 'Jam kerja standar per hari'),
('auto_backup_enabled', 'true', 'boolean', 'Aktifkan backup otomatis'),
('backup_time', '02:00', 'time', 'Waktu backup harian'),
('email_notifications', 'true', 'boolean', 'Aktifkan notifikasi email'),
('session_timeout', '60', 'number', 'Timeout session dalam menit'),
('max_login_attempts', '5', 'number', 'Maksimal percobaan login'),
('audit_logging', 'true', 'boolean', 'Aktifkan audit logging');