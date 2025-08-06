import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '@/hooks/useEmployees';
import { useLeaveQuotas, useCreateLeaveQuota, useUpdateLeaveQuota, useDeleteLeaveQuota } from '@/hooks/useLeaveQuotas';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const CURRENT_YEAR = new Date().getFullYear();

const getYearOptions = (quotas: any[]) => {
  const years = Array.from(new Set(quotas.map(q => q.year)));
  const now = new Date().getFullYear();
  const base = Array.from({ length: 6 }, (_, i) => now - 2 + i);
  return Array.from(new Set(['all', ...base, ...years])).sort((a, b) => (a === 'all' ? -1 : b === 'all' ? 1 : Number(a) - Number(b)));
};

const LeaveQuotaManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    year: CURRENT_YEAR as number,
    total_quota: '',
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<string | number>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Access control: only HRD or superadmin
  useEffect(() => {
    const role = user?.user_metadata?.role || user?.role;
    if (user && role !== 'hrd' && role !== 'superadmin') {
      toast({ title: 'Akses ditolak', description: 'Hanya HRD & Superadmin yang bisa mengatur kuota cuti', variant: 'destructive' });
      navigate('/');
    }
  }, [user, navigate, toast]);

  const { data: employees = [], isLoading: loadingEmp } = useEmployees();
  const { data: quotas = [], isLoading: loadingQuota, refetch } = useLeaveQuotas();
  const createQuota = useCreateLeaveQuota();
  const updateQuota = useUpdateLeaveQuota();
  const deleteQuota = useDeleteLeaveQuota();

  // Gabungkan data quota dengan data karyawan
  let quotaRows = quotas.map((q: any) => {
    const emp = employees.find((e: any) => e.id === q.employee_id);
    return emp ? { ...q, employee: emp } : null;
  }).filter(Boolean);
  if (filterYear !== 'all') {
    quotaRows = quotaRows.filter((row: any) => row.year === Number(filterYear));
  }

  // Filter dan pagination pada quotaRows
  const filteredRows = quotaRows.filter((row: any) => {
    const q = search.toLowerCase();
    return (
      (row.employee?.first_name?.toLowerCase().includes(q) || false) ||
      (row.employee?.last_name?.toLowerCase().includes(q) || false) ||
      (row.employee?.email?.toLowerCase().includes(q) || false) ||
      (row.employee?.departemen?.nama?.toLowerCase().includes(q) || false) ||
      (row.employee?.position?.toLowerCase().includes(q) || false) ||
      (row.quota_type?.toLowerCase().includes(q) || false)
    );
  });
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  // Untuk dropdown karyawan: hanya tampilkan yang belum ada kuota di tahun tsb, atau semua jika edit
  const availableEmployees = employees.filter((emp: any) => {
    if (editId) return true;
    return !quotas.some((q: any) => q.employee_id === emp.id && q.year === form.year);
  });

  const handleOpenDialog = () => {
    setForm({ employee_id: '', year: filterYear === 'all' ? CURRENT_YEAR : Number(filterYear), total_quota: '' });
    setEditId(null);
    setDialogOpen(true);
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'year' ? Number(value) : value }));
    // Jika pilih karyawan+tahun sudah ada, masuk mode edit
    if (name === 'employee_id' || name === 'year') {
      const existing = quotas.find((q: any) => q.employee_id === (name === 'employee_id' ? value : form.employee_id) && q.year === Number(name === 'year' ? value : form.year));
      if (existing) {
        setEditId(existing.id);
        setForm({ employee_id: existing.employee_id, year: existing.year, total_quota: String(existing.total_quota) });
      } else {
        setEditId(null);
        setForm((prev) => ({ ...prev, total_quota: '' }));
      }
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.employee_id || !form.year || !form.total_quota) {
      toast({ title: 'Error', description: 'Semua field wajib diisi', variant: 'destructive' });
      return;
    }
    try {
      if (editId) {
        await updateQuota.mutateAsync({ id: editId, total_quota: Number(form.total_quota) });
        toast({ title: 'Berhasil', description: 'Kuota cuti berhasil diupdate', variant: 'default' });
      } else {
        await createQuota.mutateAsync({ employee_id: form.employee_id, year: Number(form.year), quota_type: 'tahunan', total_quota: Number(form.total_quota) });
        toast({ title: 'Berhasil', description: 'Kuota cuti berhasil diinput', variant: 'default' });
      }
      setDialogOpen(false);
      setForm({ employee_id: '', year: filterYear === 'all' ? CURRENT_YEAR : Number(filterYear), total_quota: '' });
      setEditId(null);
      refetch && refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Gagal simpan kuota cuti', variant: 'destructive' });
    }
  };

  // Handler hapus kuota
  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteQuota.mutateAsync(deleteId);
      toast({ title: 'Berhasil', description: 'Kuota cuti berhasil dihapus', variant: 'default' });
      refetch && refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Gagal menghapus kuota cuti', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  if (loadingEmp || loadingQuota) return <div>Memuat data...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mr-4">&larr; Kembali</Button>
        <h2 className="text-xl font-bold">Pengaturan Kuota Cuti</h2>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <div className="text-lg font-semibold">Daftar Kuota Cuti Karyawan</div>
            <div className="text-gray-500 text-sm">Kelola kuota cuti tahunan seluruh karyawan</div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Tahun:</Label>
            <Select value={String(filterYear)} onValueChange={(value) => setFilterYear(value === 'all' ? 'all' : Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {getYearOptions(quotas).filter(y => y !== 'all').map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700">+ Atur Kuota Cuti</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editId ? 'Edit Kuota Cuti' : 'Atur Kuota Cuti Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Input 
                      name="year" 
                      type="number" 
                      min={2020} 
                      max={2100} 
                      value={form.year} 
                      onChange={handleFormChange} 
                      required 
                      disabled={!!editId} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Pilih Karyawan</Label>
                    <Select 
                      value={form.employee_id} 
                      onValueChange={(value) => handleFormChange({ target: { name: 'employee_id', value } })}
                      disabled={!!editId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih karyawan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                              <span className="text-sm text-gray-500">{emp.email}</span>
                              {emp.position && (
                                <span className="text-xs text-gray-400">{emp.position}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_quota">Jumlah Kuota Cuti</Label>
                    <Input 
                      name="total_quota" 
                      type="number" 
                      min={0} 
                      value={form.total_quota} 
                      onChange={handleFormChange} 
                      required 
                      placeholder="Masukkan jumlah hari cuti"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createQuota.status === 'pending' || updateQuota.status === 'pending'}>
                      {editId ? 'Update' : 'Simpan'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border px-2 py-1 rounded w-64"
            placeholder="Cari nama, email, departemen, posisi, jenis kuota..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          />
          <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Posisi</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Kuota Cuti</TableHead>
              <TableHead>Terpakai</TableHead>
              <TableHead>Sisa</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400">Belum ada data kuota cuti</TableCell>
              </TableRow>
            )}
            {pagedRows.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : '-'}</TableCell>
                <TableCell>{row.employee?.email || '-'}</TableCell>
                <TableCell>{row.employee?.position || '-'}</TableCell>
                <TableCell>{row.employee?.departemen?.nama || '-'}</TableCell>
                <TableCell>{row.year}</TableCell>
                <TableCell>{row.total_quota}</TableCell>
                <TableCell>{row.used_quota || 0}</TableCell>
                <TableCell>{row.total_quota - (row.used_quota || 0)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="mr-2" onClick={() => {
                    setEditId(Number(row.id));
                    setForm({ employee_id: row.employee_id, year: row.year, total_quota: String(row.total_quota) });
                    setDialogOpen(true);
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => { setDeleteId(Number(row.id)); setDeleteDialogOpen(true); }} disabled={deleteQuota.status === 'pending'}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-4 gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt; Sebelumnya</button>
          <span>Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Selanjutnya &gt;</button>
        </div>
      </div>
      {/* Dialog konfirmasi hapus */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Kuota Cuti</DialogTitle>
          </DialogHeader>
          <div>Yakin ingin menghapus kuota cuti ini? Tindakan ini tidak dapat dibatalkan.</div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteQuota.status === 'pending'}>Hapus</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveQuotaManagement; 