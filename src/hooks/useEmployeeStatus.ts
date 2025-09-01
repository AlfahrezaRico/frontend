import { useState, useEffect } from 'react';

export const useEmployeeStatus = () => {
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/employee-status`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data status kontrak');
        }
        const data = await response.json();
        setStatusList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return { statusList, loading, error };
};
