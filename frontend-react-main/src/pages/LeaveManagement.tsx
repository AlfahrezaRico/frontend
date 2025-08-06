import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeaveRequests, useUpdateLeaveRequest, useCreateLeaveRequest, useDeleteLeaveRequest, useUsernamesByIds } from '@/hooks/useLeaveRequests';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

const LeaveManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk dialog form cuti
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [detailRequest, setDetailRequest] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // State untuk dialog penolakan cuti
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const rejectIdRef = useRef<string | null>(null);

  // Ambil employee_id user login
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (user?.id) {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/employees?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployeeId(data && data.id ? data.id : null);
          // PATCH: Error hanya untuk karyawan
          if ((!data || !data.id) && userRole === 'karyawan') setErrorMsg('Data karyawan tidak ditemukan untuk user login ini. Hubungi admin.');
        } else if (res.status === 404) {
          setEmployeeId(null);
          if (userRole === 'karyawan') setErrorMsg('Data karyawan tidak ditemukan untuk user login ini. Hubungi admin.');
        } else {
          setEmployeeId(null);
          setErrorMsg('Gagal mengambil data karyawan.');
        }
      }
    };
    fetchEmployeeId();
  }, [user, userRole]);

  // Ambil role user login
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/users/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserRole(data?.role || null);
        } else {
          setUserRole(null);
          setErrorMsg('Gagal mengambil data role user.');
        }
      }
    };
    fetchUserRole();
  }, [user]);

  // Gunakan useLeaveRequests dengan filter employeeId jika karyawan
  const filterReady = userRole !== null && (userRole !== 'karyawan' || !!employeeId);
  const { data: leaveRequests = [], isLoading, refetch } = useLeaveRequests(
    userRole === 'karyawan' ? (employeeId || undefined) : undefined,
    filterReady,
    userRole,
    userRole === 'karyawan' ? user?.id : undefined
  );

  // Tambahkan: Refetch leaveRequests setiap employeeId/userRole/filterReady berubah
  useEffect(() => {
    if (filterReady && refetch) {
      refetch();
    }
  }, [employeeId, userRole, filterReady, refetch]);

  // Ambil semua UUID approved_by dan rejected_by yang muncul di leaveRequests
  const allUserIds: string[] = Array.from(new Set(
    leaveRequests
      .map((r: any) => [r.approved_by, r.rejected_by])
      .flat()
      .filter((id: any): id is string => Boolean(id) && typeof id === 'string')
  ));
  const { data: userMap = {} } = useUsernamesByIds(allUserIds);

  // Debug log
  const updateLeaveRequest = useUpdateLeaveRequest();
  const createLeaveRequest = useCreateLeaveRequest();
  const deleteLeaveRequest = useDeleteLeaveRequest();
  const { toast } = useToast();

  // Tambahkan fungsi untuk validasi tanggal overlap dan tanggal mulai
  const todayStr = new Date().toISOString().slice(0, 10);
  const isDateInPast = (date: string) => date < todayStr;
  const isDateOverlap = (start: string, end: string) => {
    return leaveRequests.some((req: any) => {
      // Hanya cek yang status PENDING/APPROVED
      if (!["PENDING", "APPROVED"].includes(req.status)) return false;
      // Cek overlap
      return (
        (start <= req.end_date && end >= req.start_date)
      );
    });
  };

  // Dummy submit handler (ganti dengan API call sesuai kebutuhan)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); // Clear previous errors
    if (isDateInPast(formData.start_date)) {
      toast({ title: 'Error', description: 'Tanggal mulai tidak boleh sebelum hari ini.', variant: 'destructive' });
      return;
    }
    if (isDateOverlap(formData.start_date, formData.end_date)) {
      toast({ title: 'Error', description: 'Anda sudah memiliki pengajuan cuti di tanggal tersebut.', variant: 'destructive' });
      return;
    }
    // Validasi tanggal
    if (formData.start_date > formData.end_date) {
      toast({ title: 'Error', description: 'Tanggal mulai tidak boleh setelah tanggal selesai.', variant: 'destructive' });
      return;
    }
    try {
      // Validasi sisa cuti jika alasan bukan Sakit dan jenis cuti bukan Melahirkan
      if (formData.reason.toLowerCase() !== 'sakit' && formData.leave_type !== 'Melahirkan') {
        // Hitung jumlah hari cuti
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Ambil sisa cuti
        const year = start.getFullYear();
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/leave-quotas/me?user_id=${user?.id}&year=${year}&quota_type=tahunan`);
        if (res.ok) {
          const data = await res.json();
          const quota = Array.isArray(data) && data.length > 0 ? data[0] : null;
          const sisa = quota ? quota.total_quota - (quota.used_quota || 0) : 0;
          if (duration > sisa) {
            toast({ title: 'Gagal', description: `Sisa cuti Anda hanya ${sisa} hari. Tidak bisa mengajukan ${duration} hari.`, variant: 'destructive' });
            return;
          }
        } else {
          toast({ title: 'Error', description: 'Gagal mengambil data sisa cuti', variant: 'destructive' });
          return;
        }
      }
      const API_URL = import.meta.env.VITE_API_URL || '';
      await createLeaveRequest.mutateAsync({
        ...formData,
        user_id: user?.id,
      });
      toast({ title: 'Berhasil', description: 'Pengajuan cuti berhasil dikirim' });
      setFormOpen(false);
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
      setEditingRequest(null);
      // Tambahkan delay singkat sebelum refetch agar backend pasti update
      setTimeout(() => {
        refetch && refetch();
      }, 300);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal mengirim pengajuan cuti', variant: 'destructive' });
    }
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setFormData({
      leave_type: request.leave_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await deleteLeaveRequest.mutateAsync(id);
      toast({ title: 'Berhasil', description: 'Pengajuan cuti berhasil dihapus' });
      refetch && refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menghapus pengajuan cuti', variant: 'destructive' });
    }
  };

  // Filter dan pagination
  const filteredRequests = leaveRequests.filter(req => {
    const q = search.toLowerCase();
    return (
      (req.employee?.first_name?.toLowerCase().includes(q) || false) ||
      (req.employee?.last_name?.toLowerCase().includes(q) || false) ||
      (req.employee?.email?.toLowerCase().includes(q) || false) ||
      (req.leave_type?.toLowerCase().includes(q) || false) ||
      (req.status?.toLowerCase().includes(q) || false)
    );
  });
  const pagedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRequests.length / pageSize);

  const handleApproveLeave = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await updateLeaveRequest.mutateAsync({
        id,
        status: 'APPROVED',
        approver_id: user?.id // Tambahkan UUID HRD
      });
      toast({
        title: 'Berhasil',
        description: 'Pengajuan cuti telah disetujui',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyetujui pengajuan cuti',
        variant: 'destructive',
      });
    }
  };

  const handleRejectLeave = async (id: string, reason: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await updateLeaveRequest.mutateAsync({
        id,
        status: 'REJECTED',
        rejection_reason: reason,
        rejector_id: user?.id // Tambahkan UUID HRD
      });
      toast({
        title: 'Berhasil',
        description: 'Pengajuan cuti telah ditolak',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menolak pengajuan cuti',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Ditolak</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (errorMsg) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">{errorMsg}</div>;
  }
  // Tambahkan loading state jika user, employeeId, atau userRole belum siap
  if (!user || (userRole === 'karyawan' && !employeeId) || userRole === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(userRole === 'karyawan' ? '/dashboard/karyawan' : '/dashboard/hrd')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Manajemen Cuti</h1>
            </div>
            <Button onClick={() => { setFormOpen(true); setEditingRequest(null); }}>Ajukan Cuti</Button>
          </div>
        </div>
      </header>
      {userRole === 'karyawan' && !employeeId && (
        <div className="bg-yellow-100 text-yellow-800 p-4 text-center">PERINGATAN: Data karyawan tidak ditemukan untuk user login ini. Silakan cek mapping user_id di tabel employees.</div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Pengajuan Cuti & Izin
              </CardTitle>
              <CardDescription>
                Kelola semua pengajuan cuti dan izin karyawan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="border px-2 py-1 rounded w-64"
                  placeholder="Cari nama, email, jenis cuti, status..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                />
                <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
              </div>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Jenis Cuti</TableHead>
                      <TableHead>Tanggal Mulai</TableHead>
                      <TableHead>Tanggal Selesai</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.employee ? 
                            `${request.employee.first_name} ${request.employee.last_name}` : 
                            'Unknown Employee'
                          }
                        </TableCell>
                        <TableCell>{request.leave_type}</TableCell>
                        <TableCell>{new Date(request.start_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{new Date(request.end_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{request.reason}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setDetailRequest(request)}>
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Detail Pengajuan Cuti</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2">
                                  <div><b>Nama:</b> {request.employee ? `${request.employee.first_name} ${request.employee.last_name}` : '-'}</div>
                                  <div><b>Jenis Cuti:</b> {request.leave_type}</div>
                                  <div><b>Tanggal Mulai:</b> {new Date(request.start_date).toLocaleDateString('id-ID')}</div>
                                  <div><b>Tanggal Selesai:</b> {new Date(request.end_date).toLocaleDateString('id-ID')}</div>
                                  <div><b>Alasan:</b> {request.reason}</div>
                                  <div><b>Status:</b> {getStatusBadge(request.status)}</div>
                                  {request.status === 'APPROVED' && request.approved_by && (
                                    <div><b>Disetujui oleh:</b> {request.approvedByUser ? (request.approvedByUser.role ? request.approvedByUser.role.toUpperCase() : 'Unknown Role') : 'Unknown Role'}</div>
                                  )}
                                  {request.status === 'REJECTED' && (
                                    <>
                                      <div><b>Alasan Penolakan:</b> {request.rejection_reason}</div>
                                      {request.rejected_by && (
                                        <div><b>Ditolak oleh:</b> {request.rejectedByUser ? (request.rejectedByUser.role ? request.rejectedByUser.role.toUpperCase() : 'Unknown Role') : 'Unknown Role'}</div>
                                      )}
                                      {request.rejected_at && (
                                        <div><b>Tanggal Penolakan:</b> {new Date(request.rejected_at).toLocaleDateString('id-ID')}</div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {request.status === 'PENDING' && (
                              <>
                                {userRole !== 'karyawan' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveLeave(request.id)}
                                      disabled={updateLeaveRequest.isPending}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setRejectDialogOpen(true);
                                        rejectIdRef.current = request.id;
                                        setRejectReason('');
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {userRole === 'karyawan' && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(request)}>Edit</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(request.id)}>Delete</Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-4 gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt; Sebelumnya</button>
                <span>Halaman {page} dari {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Selanjutnya &gt;</button>
              </div>
              {/* Dialog Form Pengajuan/Edit Cuti */}
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingRequest ? 'Edit Pengajuan Cuti' : 'Ajukan Cuti'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="leave_type">Jenis Cuti</Label>
                      <Select value={formData.leave_type} onValueChange={val => setFormData(f => ({ ...f, leave_type: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis cuti" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tahunan">Tahunan</SelectItem>
                          <SelectItem value="Melahirkan">Melahirkan</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.leave_type === 'Melahirkan' && (
                        <p className="text-sm text-blue-600 mt-1">
                          ℹ️ Cuti melahirkan tidak memerlukan kuota cuti tahunan
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="start_date">Tanggal Mulai</Label>
                      <Input type="date" id="start_date" value={formData.start_date} onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))} required min={todayStr} />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Tanggal Selesai</Label>
                      <Input type="date" id="end_date" value={formData.end_date} onChange={e => setFormData(f => ({ ...f, end_date: e.target.value }))} required />
                    </div>
                    <div>
                      <Label htmlFor="reason">Alasan</Label>
                      <Input id="reason" value={formData.reason} onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))} required />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
                      <Button type="submit">{editingRequest ? 'Simpan Perubahan' : 'Ajukan'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Dialog Penolakan Cuti UX lebih baik */}
              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Alasan Penolakan</DialogTitle>
                    <CardDescription>Masukkan alasan penolakan cuti secara jelas dan sopan. Alasan ini akan terlihat oleh karyawan.</CardDescription>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={async e => {
                      e.preventDefault();
                      setRejectLoading(true);
                      const API_URL = import.meta.env.VITE_API_URL || '';
                      await handleRejectLeave(rejectIdRef.current!, rejectReason);
                      setRejectLoading(false);
                      setRejectDialogOpen(false);
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="rejection_reason">Alasan Penolakan</Label>
                      <Input
                        id="rejection_reason"
                        name="rejection_reason"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        required
                        className="h-12 text-base"
                        placeholder="Contoh: Tidak sesuai kebijakan, dokumen kurang lengkap, dll."
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" className="mr-2" onClick={() => setRejectDialogOpen(false)} disabled={rejectLoading}>
                        Batal
                      </Button>
                      <Button type="submit" variant="destructive" disabled={rejectLoading}>
                        {rejectLoading ? 'Memproses...' : 'Tolak'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LeaveManagement;
