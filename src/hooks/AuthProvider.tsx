import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext({ user: null, role: null, loading: true });

export const DarkModeContext = createContext({ darkMode: false, setDarkMode: (v: boolean) => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, logout } = useAuth();
  const role = user?.role ?? null;
  const { toast } = useToast ? useToast() : { toast: () => {} };
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes
  const WARNING_TIME = INACTIVITY_LIMIT - 30 * 1000; // 30 seconds before logout
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Handle automatic redirects based on auth state changes
  useEffect(() => {
    if (user && user.role && !loading) {
      // User is logged in and role is loaded
      const currentPath = location.pathname;
      
      // Don't redirect if already on correct dashboard or allowed pages
      if (currentPath.startsWith('/dashboard/') || 
          currentPath.startsWith('/employee-management') ||
          currentPath.startsWith('/attendance-management') ||
          currentPath.startsWith('/leave-management') ||
          currentPath.startsWith('/hr-reports') ||
          currentPath.startsWith('/superadmin/') ||
          currentPath.startsWith('/payroll-management') ||
          currentPath.startsWith('/hrd-izin-sakit-management')
      ) {
        return;
      }

      // Redirect to appropriate dashboard
      switch (user.role) {
        case 'superadmin':
          navigate('/dashboard/superadmin');
          break;
        case 'hrd':
          navigate('/dashboard/hrd');
          break;
        case 'karyawan':
          navigate('/dashboard/karyawan');
          break;
        default:
          toast({
            title: 'Login Gagal',
            description: 'Role tidak dikenali.',
            variant: 'destructive',
          });
          break;
      }
    } else if (!user && !loading) {
      // User is logged out
      const currentPath = location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        navigate('/login');
      }
    }
  }, [user, loading, navigate, location.pathname, toast]);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      // Set warning toast 30s before logout
      warningRef.current = setTimeout(() => {
        if (user) {
          toast && toast({
            title: 'Sesi akan berakhir',
            description: 'Anda akan logout otomatis dalam 30 detik karena tidak ada aktivitas.',
            variant: 'default',
          });
        }
      }, WARNING_TIME);
      // Set logout timer
      timerRef.current = setTimeout(async () => {
        if (user) {
          toast && toast({
            title: 'Logout Otomatis',
            description: 'Anda telah logout karena tidak ada aktivitas lebih dari 5 menit.',
            variant: 'destructive',
          });
          await logout();
          navigate('/login');
        }
      }, INACTIVITY_LIMIT);
    };
    // List of events that indicate user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
    // eslint-disable-next-line
  }, [user]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
    </DarkModeContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext); 