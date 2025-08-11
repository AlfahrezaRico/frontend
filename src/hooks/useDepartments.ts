import { useQuery } from '@tanstack/react-query';

export function useDepartments() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/departemen`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`Gagal mengambil data departemen: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });
}

export type Department = {
  id: string;
  nama: string;
  created_at: string;
}; 