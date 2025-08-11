import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEmployees() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/employees?include_departemen=1`);
      
      // Jika response 404 atau 500, kembalikan array kosong alih-alih error
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        
        // Jika error karena tidak ada data atau masalah database, kembalikan array kosong
        if (res.status === 404 || res.status === 500) {
          return [];
        }
        
        throw new Error(`Gagal mengambil data employees: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      return data;
    },
    retry: 1, // Kurangi retry
    retryDelay: 1000,
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus karyawan');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, departemen_id: data.departemen_id })
      });
      if (!res.ok) throw new Error('Gagal menambah karyawan');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, departemen_id: data.departemen_id })
      });
      if (!res.ok) throw new Error('Gagal update karyawan');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
}

export type Employee = any; 