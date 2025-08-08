import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Clock,
  BarChart3,
  Menu,
  X,
  Home,
  LogOut,
  Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface HRDSidebarProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export const HRDSidebar = ({ currentPage = 'dashboard', onPageChange }: HRDSidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview dan statistik',
      onClick: () => handleNavigation('dashboard')
    },
    {
      id: 'employees',
      label: 'Data Karyawan',
      icon: Users,
      description: 'Kelola data dan informasi karyawan',
      onClick: () => navigate('/employee-management')
    },
    {
      id: 'attendance',
      label: 'Data Absensi',
      icon: Clock,
      description: 'Monitor kehadiran dan jam kerja karyawan',
      onClick: () => navigate('/attendance-management')
    },
    {
      id: 'leave',
      label: 'Manajemen Cuti',
      icon: Calendar,
      description: 'Kelola pengajuan dan persetujuan cuti',
      onClick: () => navigate('/leave-management')
    },
    {
      id: 'izin-sakit',
      label: 'Manajemen Izin/Sakit',
      icon: FileText,
      description: 'Urus izin sakit dan persetujuan karyawan',
      onClick: () => navigate('/hrd-izin-sakit-management')
    },
    {
      id: 'payroll',
      label: 'Management Payroll',
      icon: DollarSign,
      description: 'Kelola data gaji dan pembayaran',
      onClick: () => navigate('/payroll-management')
    },
    {
      id: 'payroll-config',
      label: 'Konfigurasi Payroll',
      icon: Settings,
      description: 'Kelola komponen perhitungan otomatis',
      onClick: () => navigate('/payroll-configuration')
    },
    {
      id: 'reports',
      label: 'Laporan HR',
      icon: BarChart3,
      description: 'Generate laporan untuk keperluan HR',
      onClick: () => navigate('/hr-reports')
    }
  ];

  const handleNavigation = (page: string) => {
    if (onPageChange) {
      onPageChange(page);
    }
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobile}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-80 flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">HRIS KSP</h1>
              <p className="text-blue-100 text-sm">Dashboard HRD</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Card 
                key={item.id} 
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                `}
                onClick={item.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                          {item.label}
                        </h3>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">H</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">HRD Admin</p>
              <p className="text-xs text-gray-500">Human Resources</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};