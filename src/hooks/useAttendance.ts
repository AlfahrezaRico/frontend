
import { useQuery } from '@tanstack/react-query';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  notes?: string;
  created_at?: string;
}

// HAPUS: Seluruh fungsi/method terkait clock-in/clock-out
