import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface LeaveQuota {
  id: number; // pastikan number, bukan string
  employee_id: string;
  quota_type: string;
  year: number;
  total_quota: number;
  used_quota: number;
  created_at?: string;
  updated_at?: string;
}

// Ambil leave quota (bisa filter employee_id, year, quota_type)
export const useLeaveQuotas = (params?: { employee_id?: string; year?: number; quota_type?: string }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useQuery({
    queryKey: ['leaveQuotas', params],
    queryFn: async () => {
      let url = '/api/leave-quotas';
      const qs = [];
      if (params?.employee_id) qs.push(`employee_id=${params.employee_id}`);
      if (params?.year) qs.push(`year=${params.year}`);
      if (params?.quota_type) qs.push(`quota_type=${params.quota_type}`);
      if (qs.length > 0) url += '?' + qs.join('&');
      const res = await fetch(`${API_URL}${url}`);
      if (!res.ok) throw new Error('Gagal mengambil data leave quota');
      return await res.json();
    },
  });
};

// Tambah leave quota
export const useCreateLeaveQuota = () => {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async (payload: Omit<LeaveQuota, 'id' | 'created_at' | 'updated_at' | 'used_quota'> & { used_quota?: number }) => {
      const res = await fetch(`${API_URL}/api/leave-quotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal menambah leave quota');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveQuotas'] });
    },
  });
};

// Edit leave quota
export const useUpdateLeaveQuota = () => {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<LeaveQuota> & { id: number }) => {
      const res = await fetch(`${API_URL}/api/leave-quotas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Gagal update leave quota');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveQuotas'] });
    },
  });
};

// Hapus leave quota
export const useDeleteLeaveQuota = () => {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/leave-quotas/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus leave quota');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveQuotas'] });
    },
  });
}; 