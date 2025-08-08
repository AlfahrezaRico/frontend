import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Clock, Calendar, FileText, LogOut, Bell, Settings, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog";
import { useAuth } from '@/hooks/useAuth';
import { useContext, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { HRDSidebar } from '@/components/HRDSidebar';
import { EmployeesContent } from '@/components/hrd-content/EmployeesContent';
import { PayrollContent } from '@/components/hrd-content/PayrollContent';
import { AttendanceContent } from '@/components/hrd-content/AttendanceContent';
import { LeaveContent } from '@/components/hrd-content/LeaveContent';

const HRDDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: pendingLeaveRequests = [], isLoading: leaveLoading } = useLeaveRequests();
  const { toast } = useToast();

  // State untuk notifikasi
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Load read notifications from localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`readNotifications_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setReadNotifications(new Set(parsed));
        } catch (error) {
          console.error('Error parsing read notifications:', error);
          setReadNotifications(new Set());
        }
      }
    }
  }, [user?.id]);



  // Force refresh data ketika komponen mount
  useEffect(() => {
    if (user?.id) {
      // Reset state untuk memastikan data fresh
      setRejectedRequests([]);
              // Trigger fetch setelah reset
        setTimeout(() => {
          const fetchPendingRequests = async () => {
            const API_URL = import.meta.env.VITE_API_URL || '';
            
            try {
              const res = await fetch(`${API_URL}/api/notifications/hrd-pending`);
              
              if (res.ok) {
                const pendingData = await res.json();
                setRejectedRequests(pendingData);
              } else {
                setRejectedRequests([]);
              }
            } catch (error) {
              console.error('Force refresh - Fetch error:', error);
              setRejectedRequests([]);
            }
          };
          fetchPendingRequests();
        }, 100);
    }
  }, [user?.id]);

  // Fetch pengajuan cuti dan izin dengan status PENDING
  useEffect(() => {
    if (!user?.id) return;
    const fetchPendingRequests = async () => {
      const API_URL = import.meta.env.VITE_API_URL || '';
      console.log('Fetching from URL:', `${API_URL}/api/leave-requests`);
      
      try {
        // Fetch pengajuan PENDING khusus untuk HRD
        const res = await fetch(`${API_URL}/api/notifications/hrd-pending`);
        
        if (res.ok) {
          const pendingData = await res.json();
          setRejectedRequests(pendingData);
        } else {
          setRejectedRequests([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setRejectedRequests([]);
      }
    };
    fetchPendingRequests();
    
    // Auto-refresh notifikasi setiap 30 detik
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user?.id]); // Hapus dependency yang menyebabkan infinite loop

  // Tampilkan toast ketika ada pengajuan PENDING baru
  useEffect(() => {
    const unreadCount = rejectedRequests.filter(req => !readNotifications.has(req.id)).length;
    
    if (unreadCount > 0 && !readNotifications.size) {
      toast({
        title: 'Pengajuan Cuti & Izin Baru',
        description: `Ada ${unreadCount} pengajuan cuti/izin yang memerlukan approval.`,
        variant: 'default',
      });
    }
  }, [rejectedRequests.length, readNotifications.size, toast]);

  const totalEmployees = employees.length;
  // Hapus totalSalary karena kolom salary sudah dihapus
  // const totalSalary = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);

  // Hitung notifikasi yang belum dibaca
  const unreadNotifications = rejectedRequests.filter(req => !readNotifications.has(req.id));
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = async (request: any) => {
    try {
      // Mark notification as read
      const API_URL = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.id,
          notification_id: request.id 
        })
      });
      
      // Add to read notifications
      const newReadNotifications = new Set([...readNotifications, request.id]);
      setReadNotifications(newReadNotifications);
      
      // Save to localStorage
      localStorage.setItem(`readNotifications_${user?.id}`, JSON.stringify([...newReadNotifications]));
      
      // Navigate based on request type
      if (request.request_type === 'izin_sakit') {
        navigate("/hrd-izin-sakit-management");
      } else {
        navigate("/leave-management");
      }
      
      // Close notification dialog
      setNotificationOpen(false);
      
      toast({
        title: 'Notifikasi Dibaca',
        description: 'Notifikasi telah ditandai sebagai dibaca',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      if (request.request_type === 'izin_sakit') {
        navigate("/hrd-izin-sakit-management");
      } else {
        navigate("/leave-management");
      }
      setNotificationOpen(false);
    }
  };

  // Render content based on current page
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Dashboard HRD
              </h2>
              <p className="text-gray-600">
                Kelola karyawan, absensi, dan data HR lainnya
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6 mb-8">
              <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Karyawan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {employeesLoading ? "..." : totalEmployees}
                  </div>
                  <p className="text-xs text-gray-500">Active employees</p>
                </CardContent>
              </Card>

              <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Departemen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {departmentsLoading ? "..." : new Set(departments.map(dep => dep.id).filter(Boolean)).size}
                  </div>
                  <p className="text-xs text-gray-500">Jumlah departemen aktif</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Tambah Karyawan</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Daftarkan karyawan baru
                      </CardDescription>
                    </div>
                    <UserPlus className="h-8 w-8 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <AddEmployeeDialog onEmployeeAdded={() => {}} />
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Pending Requests</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {rejectedRequests.length} menunggu persetujuan
                      </CardDescription>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentPage('leave')}
                  >
                    Lihat Semua
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Performance</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Overview sistem HR
                      </CardDescription>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentPage('reports')}
                  >
                    Lihat Reports
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Statistik Karyawan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Karyawan Aktif</span>
                      <span className="font-semibold text-lg">{totalEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Departemen</span>
                      <span className="font-semibold text-lg">{new Set(departments.map(dep => dep.id).filter(Boolean)).size}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Leave Requests</span>
                      <span className="font-semibold text-lg text-orange-600">{rejectedRequests.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Aktivitas Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rejectedRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.employee?.first_name} {request.employee?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.request_type === 'izin_sakit' ? 'Izin/Sakit' : 'Cuti'} • {request.start_date}
                          </p>
                        </div>
                      </div>
                    ))}
                    {rejectedRequests.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tidak ada aktivitas terbaru
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'employees':
        return <EmployeesContent />;
      case 'payroll':
        return <PayrollContent />;
      case 'attendance':
        return <AttendanceContent />;
      case 'leave':
        return <LeaveContent />;
      case 'izin-sakit':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manajemen Izin/Sakit</h2>
              <p className="text-gray-600">Urus izin sakit dan persetujuan karyawan</p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Fitur Manajemen Izin/Sakit akan segera hadir</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/hrd-izin-sakit-management'}
                >
                  Buka Halaman Lengkap
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'payroll-config':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Konfigurasi Payroll</h2>
              <p className="text-gray-600">Kelola komponen perhitungan otomatis</p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Fitur Konfigurasi Payroll akan segera hadir</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/payroll-configuration'}
                >
                  Buka Halaman Lengkap
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Laporan HR</h2>
              <p className="text-gray-600">Generate laporan untuk keperluan HR</p>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Fitur Laporan HR akan segera hadir</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/hr-reports'}
                >
                  Buka Halaman Lengkap
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Halaman tidak ditemukan</p>
          </div>
        );
    }
  };

  return (
    <div key={`hrd-dashboard-${user?.id}`} className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <HRDSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="lg:hidden"></div> {/* Spacer for mobile menu button */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Notifikasi Bell */}
              <div className="relative">
                <Button 
                  onClick={() => setNotificationOpen(true)} 
                  variant="outline" 
                  size="sm"
                  className="relative"
                >
                  <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-bell-ring text-red-500' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-red">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Dialog Notifikasi */}
      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
          <DialogTitle>Pengajuan Cuti & Izin Pending</DialogTitle>
        </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            {unreadCount === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada notifikasi baru
              </div>
            ) : (
              unreadNotifications.map((request, index) => (
                <div key={index} className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer" onClick={() => handleNotificationClick(request)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        Pengajuan {request.leave_type === 'Tahunan' ? 'Cuti Tahunan' : request.leave_type} - {request.employee?.first_name || 'Karyawan'}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p><strong>Jenis:</strong> {request.leave_type}</p>
                        {request.start_date && request.end_date && request.start_date !== request.end_date && (
                          <p><strong>Tanggal:</strong> {new Date(request.start_date).toLocaleDateString('id-ID')} - {new Date(request.end_date).toLocaleDateString('id-ID')}</p>
                        )}
                        {request.reason && request.reason !== 'Tidak ada alasan' && (
                          <p><strong>Alasan:</strong> {request.reason}</p>
                        )}
                        <p><strong>Tanggal Pengajuan:</strong> {new Date(request.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDDashboard;
