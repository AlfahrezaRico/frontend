CREATE TABLE IF NOT EXISTS public.leave_quotas (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL DEFAULT 'tahunan', -- jenis cuti (tahunan, besar, dll)
    year INT NOT NULL, -- tahun kuota berlaku
    total_quota INT NOT NULL, -- hak cuti tahun ini
    used_quota INT NOT NULL DEFAULT 0, -- sudah diambil
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_leave_quotas_employee_year_type ON public.leave_quotas(employee_id, year, quota_type); 