import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  const menuSections = [
    {
      title: 'MAIN',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          onClick: () => handleNavigation('dashboard')
        }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          id: 'employees',
          label: 'Data Karyawan',
          icon: Users,
          onClick: () => handleNavigation('employees')
        },
        {
          id: 'attendance',
          label: 'Data Absensi',
          icon: Clock,
          onClick: () => handleNavigation('attendance')
        },
        {
          id: 'leave',
          label: 'Manajemen Cuti',
          icon: Calendar,
          onClick: () => handleNavigation('leave')
        },
        {
          id: 'izin-sakit',
          label: 'Manajemen Izin/Sakit',
          icon: FileText,
          onClick: () => handleNavigation('izin-sakit')
        }
      ]
    },
    {
      title: 'PAYROLL',
      items: [
        {
          id: 'payroll',
          label: 'Management Payroll',
          icon: DollarSign,
          onClick: () => handleNavigation('payroll')
        },
        {
          id: 'payroll-config',
          label: 'Konfigurasi Payroll',
          icon: Settings,
          onClick: () => handleNavigation('payroll-config')
        }
      ]
    },
    {
      title: 'REPORTS',
      items: [
        {
          id: 'reports',
          label: 'Laporan HR',
          icon: BarChart3,
          onClick: () => handleNavigation('reports')
        }
      ]
    }
  ];

  const handleNavigation = (page: string) => {
    if (onPageChange) {
      onPageChange(page);
    }
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Force redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
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
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex flex-col flex-shrink-0
      `}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 font-semibold text-base">HRIS KSP</h1>
              <p className="text-gray-500 text-xs">Dashboard HRD</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="px-6 mb-2">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <div className="space-y-1 px-3">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">H</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">HRD Admin</p>
              <p className="text-xs text-gray-500">ricoaula25@gmail.com</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};