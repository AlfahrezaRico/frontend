import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/hooks/AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles: string[];
}

const roleToDashboard: Record<string, string> = {
  superadmin: '/dashboard/superadmin',
  hrd: '/dashboard/hrd',
  karyawan: '/dashboard/karyawan',
};

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (!user || !role) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }
    if (!allowedRoles.includes(role)) {
      const redirectPath = roleToDashboard[role] || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location, allowedRoles, user, role, loading]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user || !role) return null;
  if (!allowedRoles.includes(role)) return null;
  return <>{children}</>;
} 