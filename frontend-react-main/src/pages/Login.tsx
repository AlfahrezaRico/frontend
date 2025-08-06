import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Lock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { login, loading, error, fetchMe } = useAuth();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'superadmin') navigate('/dashboard/superadmin', { replace: true });
      else if (user.role === 'hrd') navigate('/dashboard/hrd', { replace: true });
      else if (user.role === 'karyawan') navigate('/dashboard/karyawan', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login(email, password);
      const userObj = await fetchMe();
      // PATCH: Force redirect with window.location.href
      if (userObj && userObj.role) {
        if (userObj.role === 'superadmin') window.location.href = '/dashboard/superadmin';
        else if (userObj.role === 'hrd') window.location.href = '/dashboard/hrd';
        else if (userObj.role === 'karyawan') window.location.href = '/dashboard/karyawan';
        else window.location.href = '/';
      }
    } catch (err: any) {
      // Security: Generic error message to prevent information disclosure
      toast({
        title: "Login Gagal",
        description: "Email atau password salah.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">HRIS KSP Mekarsari</h1>
          </div>
          <CardTitle>Login ke Sistem</CardTitle>
          <CardDescription>
            Silakan login dengan email dan password Anda untuk mengakses sistem HRIS KSP Mekarsari.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || loginLoading}
          >
            {(loading || loginLoading) ? "Memuat..." : "Masuk"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
