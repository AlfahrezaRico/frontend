import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/users`);
        if (!res.ok) throw new Error('Gagal mengambil data users');
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || 'Gagal mengambil data users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return { users, loading, error };
} 