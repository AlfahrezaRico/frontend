import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, UserPlus, Eye, User, Copy, Calendar, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useLeaveQuotas, useCreateLeaveQuota, useUpdateLeaveQuota, LeaveQuota } from '@/hooks/useLeaveQuotas';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading, error } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const { toast } = useToast();

  // State untuk dialog konfirmasi hapus
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Handle error
  useEffect(() => {
    if (error) {
      console.error('Error loading employees:', error);
      // Hanya tampilkan error toast jika bukan karena tidak ada data
      if (!error.message.includes('404') && !error.message.includes('500')) {
        toast({
          title: 'Error',
          description: 'Gagal memuat data karyawan. Silakan coba lagi.',
          variant: 'destructive',
        });
      }
    }
  }, [error, toast]);

  const handleDeleteClick = (employee: any) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee.mutateAsync(selectedEmployee.id);
      toast({
        title: 'Berhasil',
        description: 'Karyawan berhasil dihapus',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus karyawan',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState<{ employee_id: string; year: number; quota_type: string; total_quota: number; id?: string }>({ employee_id: '', year: new Date().getFullYear(), quota_type: 'tahunan', total_quota: 12 });
  const [editingQuota, setEditingQuota] = useState<LeaveQuota | null>(null);
  const { data: quotas = [], refetch: refetchQuotas } = useLeaveQuotas();
  const createQuota = useCreateLeaveQuota();
  const updateQuota = useUpdateLeaveQuota();

  const openQuotaDialog = (employee: any) => {
    const thisYear = new Date().getFullYear();
    const quota = quotas.find((q: LeaveQuota) => q.employee_id === employee.id && q.year === thisYear && q.quota_type === 'tahunan');
    if (quota) {
      setQuotaForm({ employee_id: employee.id, year: quota.year, quota_type: quota.quota_type, total_quota: quota.total_quota, id: quota.id });
      setEditingQuota(quota);
    } else {
      setQuotaForm({ employee_id: employee.id, year: thisYear, quota_type: 'tahunan', total_quota: 12 });
      setEditingQuota(null);
    }
    setQuotaDialogOpen(true);
  };

  const handleQuotaSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingQuota && quotaForm.id) {
        await updateQuota.mutateAsync({ id: quotaForm.id, total_quota: quotaForm.total_quota, year: quotaForm.year, quota_type: quotaForm.quota_type });
        toast({ title: 'Berhasil', description: 'Kuota cuti berhasil diupdate' });
      } else {
        await createQuota.mutateAsync({ employee_id: quotaForm.employee_id, year: quotaForm.year, quota_type: quotaForm.quota_type, total_quota: quotaForm.total_quota });
        toast({ title: 'Berhasil', description: 'Kuota cuti berhasil ditambahkan' });
      }
      setQuotaDialogOpen(false);
      setEditingQuota(null);
      refetchQuotas && refetchQuotas();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menyimpan kuota cuti', variant: 'destructive' });
    }
  };

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Filter dan pagination
  const filteredEmployees = employees.filter(emp => {
    const q = search.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(q) ||
      emp.last_name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      (emp.departemen?.nama || '').toLowerCase().includes(q)
    );
  });
  const pagedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/hrd')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Manajemen Karyawan</h1>
            </div>
            <AddEmployeeDialog onEmployeeAdded={() => {}} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Karyawan</CardTitle>
              <CardDescription>
                Kelola data semua karyawan dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data karyawan. Silakan tambah karyawan baru.
                </div>
              ) : (
                <>
                {/* Search Bar */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    className="border px-2 py-1 rounded w-64"
                    placeholder="Cari nama, email, posisi, departemen..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                  />
                  <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
                </div>
                {/* Tabel Karyawan */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIK</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedEmployees.map((employee) => {
                      const thisYear = new Date().getFullYear();
                      const quota = quotas.find((q: LeaveQuota) => q.employee_id === employee.id && q.year === thisYear && q.quota_type === 'tahunan');
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-mono font-medium">{employee.nik || '-'}</TableCell>
                          <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                          <TableCell>{employee.email || '-'}</TableCell>
                          <TableCell>{employee.position || '-'}</TableCell>
                          <TableCell>{employee.departemen?.nama || employee.department || '-'}</TableCell>
                          <TableCell>{employee.hire_date ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: id }) : '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <EmployeeDetailDialog employee={employee} />
                              <EditEmployeeDialog employee={employee} />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(employee)}
                                disabled={deleteEmployee.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt; Sebelumnya</button>
                  <span>Halaman {page} dari {totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Selanjutnya &gt;</button>
                </div>
                {/* Dialog konfirmasi hapus */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Konfirmasi Hapus</DialogTitle>
                    </DialogHeader>
                    <div>
                      Apakah Anda yakin ingin menghapus karyawan <b>{selectedEmployee?.first_name} {selectedEmployee?.last_name}</b>?
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteEmployee.isPending}>
                        Hapus
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Dialog atur kuota cuti */}
                <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingQuota ? 'Edit Kuota Cuti' : 'Atur Kuota Cuti'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleQuotaSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tahun</label>
                        <Input type="number" value={quotaForm.year} onChange={e => setQuotaForm(f => ({ ...f, year: Number(e.target.value) }))} min={2020} max={2100} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Jenis Kuota</label>
                        <Input value={quotaForm.quota_type} onChange={e => setQuotaForm(f => ({ ...f, quota_type: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Total Kuota (hari)</label>
                        <Input type="number" value={quotaForm.total_quota} onChange={e => setQuotaForm(f => ({ ...f, total_quota: Number(e.target.value) }))} min={0} required />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setQuotaDialogOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createQuota.isPending || updateQuota.isPending}>{editingQuota ? 'Simpan' : 'Tambah'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const EmployeeDetailDialog = ({ employee }: { employee: any }) => {
  const { toast } = useToast();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white pb-4 border-b">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Detail Karyawan</h2>
            <p className="text-gray-600 font-mono text-lg">{employee.nik || '-'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profil Karyawan Card */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-gray-600" />
              <h3 className="font-bold text-gray-800 text-lg">Profil Karyawan</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nama Lengkap</span>
                <span className="font-semibold text-gray-800">{employee.first_name} {employee.last_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Posisi</span>
                <span className="font-semibold text-gray-800">{employee.position || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Departemen</span>
                <span className="font-semibold text-gray-800">{employee.departemen?.nama || employee.department || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Email</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">{employee.email || '-'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (employee.email) {
                        navigator.clipboard.writeText(employee.email);
                        toast({
                          title: 'Berhasil',
                          description: 'Email berhasil disalin',
                        });
                      }
                    }}
                    className="p-2 h-8 w-8 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nomor Telepon</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">{employee.phone_number || '-'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (employee.phone_number) {
                        navigator.clipboard.writeText(employee.phone_number);
                        toast({
                          title: 'Berhasil',
                          description: 'Nomor telepon berhasil disalin',
                        });
                      }
                    }}
                    className="p-2 h-8 w-8 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="text-gray-600 font-medium">Alamat</span>
                <span className="font-semibold text-gray-800 text-right max-w-md leading-relaxed">{employee.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Informasi Kepegawaian Card */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-gray-600" />
              <h3 className="font-bold text-gray-800 text-lg">Informasi Kepegawaian</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Tanggal Lahir</span>
                <span className="font-semibold text-gray-800">{employee.date_of_birth ? format(new Date(employee.date_of_birth), 'dd MMMM yyyy', { locale: id }) : '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Tanggal Bergabung</span>
                <span className="font-semibold text-gray-800">{employee.hire_date ? format(new Date(employee.hire_date), 'dd MMMM yyyy', { locale: id }) : '-'}</span>
              </div>
            </div>
          </div>

          {/* Informasi Bank Card */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-gray-600" />
              <h3 className="font-bold text-gray-800 text-lg">Informasi Bank</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Nama Bank</span>
                <span className="font-semibold text-gray-800">{employee.bank_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Nomor Rekening</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 font-mono">{employee.bank_account_number || '-'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (employee.bank_account_number) {
                        navigator.clipboard.writeText(employee.bank_account_number);
                        toast({
                          title: 'Berhasil',
                          description: 'Nomor rekening berhasil disalin',
                        });
                      }
                    }}
                    className="p-2 h-8 w-8 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeManagement;
