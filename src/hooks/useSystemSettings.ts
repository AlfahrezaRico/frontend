import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSystemSettings() {
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || '';
  const { data, isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/system-settings`);
      if (!res.ok) throw new Error('Gagal mengambil pengaturan sistem');
      return await res.json();
    }
  });

  const updateSetting = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_URL}/api/system-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Gagal update pengaturan');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    }
  });

  return { settings: data, loading: isLoading, updateSetting: updateSetting.mutateAsync };
} 