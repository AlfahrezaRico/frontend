import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<any>; // PATCH: add fetchMe to interface
}

const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || '';

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Production: fetch user from /api/me
  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSession(null);
        return data.user;
      } else {
        setUser(null);
        setSession(null);
        return null;
      }
    } catch {
      setUser(null);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch logged-in user regardless of environment
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isProd) {
        const response = await fetch(`${API_URL}/api/auth/lucia-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          let errorMsg = data.error || 'Login gagal';
          if (errorMsg.toLowerCase().includes('invalid login credentials')) {
            errorMsg = 'Email atau password salah';
          }
          throw new Error(errorMsg);
        }
        // PATCH: Tunggu fetchMe selesai sebelum return
        const user = await fetchMe();
        return user;
      } else {
        // Dev env: panggil /api/me setelah login via mekanisme dev Anda jika ada
        const user = await fetchMe();
        return user;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
      setLoading(false);
      throw err;
    }
  }, [fetchMe]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isProd) {
        await fetch(`${API_URL}/api/auth/lucia-logout`, { method: 'POST', credentials: 'include' });
        setUser(null);
        setSession(null);
        // PATCH: Tunggu fetchMe selesai sebelum return
        await fetchMe();
        return null;
      } else {
        setUser(null);
        setSession(null);
        await fetchMe();
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat logout.');
    } finally {
      setLoading(false);
    }
  }, [fetchMe]);

  return { user, session, loading, error, login, logout, fetchMe };
};