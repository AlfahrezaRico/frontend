import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Clock, Calendar, FileText, LogOut, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog";
import { useAuth } from '@/hooks/useAuth';
import { useContext, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div key={`hrd-dashboard-${user?.id}`} className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">HRIS KSP Mekarsari</h1>
                <p className="text-sm text-gray-500">HRD Dashboard</p>
              </div>
            </div>
          <div className="flex items-center gap-2">
            {/* Notifikasi Bell */}
            <div className="relative">
              <Button 
                onClick={() => setNotificationOpen(true)} 
                variant="outline" 
                size="sm"
                className="relative"
              >
                <Bell className={`h-4 w-4 mr-2 ${unreadCount > 0 ? 'animate-bell-ring text-red-500' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-red">
                    {unreadCount}
                  </span>
                )}
                Notifikasi
              </Button>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
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

            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
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

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <UserPlus className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Tambah Karyawan</CardTitle>
                <CardDescription>
                  Daftarkan karyawan baru ke dalam sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddEmployeeDialog onEmployeeAdded={() => {}} />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Data Karyawan</CardTitle>
                <CardDescription>
                  Lihat dan kelola data semua karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/employee-management')}
                >
                  Kelola Karyawan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Clock className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Data Absensi</CardTitle>
                <CardDescription>
                  Monitor kehadiran dan jam kerja karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate('/attendance-management')}
                >
                  Lihat Absensi
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Manajemen Cuti</CardTitle>
                <CardDescription>
                  Kelola pengajuan cuti dan izin karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate('/leave-management')}
                >
                  Kelola Cuti
                </Button>
              </CardContent>
            </Card>

            {/* Management Payroll */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/payroll-management')}>
              <CardHeader>
                <FileText className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Management Payroll</CardTitle>
                <CardDescription>
                  Kelola data gaji, slip gaji, dan histori pembayaran karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={e => { e.stopPropagation(); navigate('/payroll-management'); }}
                >
                  Kelola Payroll
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Laporan HR</CardTitle>
                <CardDescription>
                  Generate laporan untuk keperluan HR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => navigate('/hr-reports')}
                >
                  Buat Laporan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Calendar className="h-8 w-8 text-cyan-600 mb-2" />
                <CardTitle>Pengaturan Kuota Cuti</CardTitle>
                <CardDescription>
                  Atur dan update kuota cuti karyawan per tahun
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => navigate('/dashboard/hrd/leave-quotas')}
                >
                  Atur Kuota Cuti
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 border-blue-100 rounded-xl cursor-pointer" onClick={() => window.location.href = '/hrd-izin-sakit-management'}>
              <CardHeader className="flex flex-col items-center">
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg font-bold text-center">Manajemen Izin/Sakit</CardTitle>
                <CardDescription className="text-gray-500 text-center">Lihat & kelola pengajuan izin/sakit karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" onClick={e => { e.stopPropagation(); window.location.href = '/hrd-izin-sakit-management'; }}>
                  Kelola Izin/Sakit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
