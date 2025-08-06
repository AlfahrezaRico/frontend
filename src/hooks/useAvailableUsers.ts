import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useAvailableUsers() {
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      setLoading(true);
      try {
        // Ambil semua users
        const usersRes = await fetch(`${API_URL}/api/users`);
        if (!usersRes.ok) throw new Error('Gagal mengambil data users');
        const users = await usersRes.json();

        // Ambil semua employees
        const employeesRes = await fetch(`${API_URL}/api/employees`);
        if (!employeesRes.ok) throw new Error('Gagal mengambil data employees');
        const employees = await employeesRes.json();

        // Filter users yang belum memiliki data karyawan
        const usersWithEmployees = employees.map((emp: any) => emp.user_id).filter(Boolean);
        const availableUsers = users.filter((user: any) => !usersWithEmployees.includes(user.id));

        setAvailableUsers(availableUsers);
      } catch (err: any) {
        setError(err.message || 'Gagal mengambil data available users');
        setAvailableUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableUsers();
  }, []);

  return { availableUsers, loading, error };
} 