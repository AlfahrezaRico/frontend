import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useLeaveRequests(employeeId?: string, enabled = true, userRole?: string, userId?: string) {
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useQuery({
    queryKey: ['leaveRequests', employeeId, userRole, userId],
    enabled,
    queryFn: async () => {
      let url = '/api/leave-requests';
      const params: any = {};
      // PATCH: Selalu kirim role
      if (userRole) params.role = userRole;
      if (userRole === 'karyawan' && userId) params.user_id = userId;
      else if (userRole !== 'karyawan' && employeeId) params.employee_id = employeeId;
      const qs = new URLSearchParams(params).toString();
      if (qs) url += '?' + qs;
      const res = await fetch(`${API_URL}${url}`);
      if (!res.ok) throw new Error('Gagal mengambil data cuti');
      return await res.json();
    }
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leave-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Gagal update cuti');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    }
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leave-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Gagal mengajukan cuti');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    }
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leave-requests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus cuti');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    }
  });
}

export function useUsernamesByIds(ids: string[]) {
  // Implementasi: fetch ke backend jika ada endpoint, atau mapping manual
  return { data: {} };
} 