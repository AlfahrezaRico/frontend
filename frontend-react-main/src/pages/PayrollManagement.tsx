import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || "";

export default function PayrollManagement() {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    pay_period_start: "",
    pay_period_end: "",
    gross_salary: 0,
    deductions: 0,
    net_salary: 0,
    payment_date: "",
    status: "PAID"
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payrolls`);
      if (!res.ok) throw new Error("Gagal mengambil data payroll");
      const data = await res.json();
      setPayrolls(data);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data payroll");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/employees`);
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      const data = await res.json();
      setEmployees(data);
    } catch {}
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin hapus payroll ini?")) return;
    try {
      const res = await fetch(`${API_URL}/api/payrolls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus payroll");
      fetchPayrolls();
    } catch (err) {
      alert("Gagal hapus payroll");
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name.includes("salary") || name === "deductions" ? Number(value) : value }));
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/payrolls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Gagal tambah payroll");
      setModalOpen(false);
      setForm({ employee_id: "", pay_period_start: "", pay_period_end: "", gross_salary: 0, deductions: 0, net_salary: 0, payment_date: "", status: "PAID" });
      fetchPayrolls();
    } catch (err) {
      alert("Gagal tambah payroll");
    } finally {
      setSubmitting(false);
    }
  };

  // Search & Pagination
  const filteredPayrolls = payrolls.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.employee?.first_name?.toLowerCase().includes(q) || "") +
      (p.employee?.last_name?.toLowerCase().includes(q) || "") +
      (p.employee?.position?.toLowerCase().includes(q) || "") +
      (p.employee?.department?.toLowerCase().includes(q) || "") +
      (p.status?.toLowerCase().includes(q) || "")
    ).includes(q);
  });
  const pagedPayrolls = filteredPayrolls.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredPayrolls.length / pageSize));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/hrd')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Management Payroll</h1>
            </div>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button>Tambah Payroll</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Payroll Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPayroll} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Pilih Karyawan</label>
                    <select
                      name="employee_id"
                      value={form.employee_id}
                      onChange={handleFormChange}
                      className="border px-2 py-1 rounded w-full"
                      required
                    >
                      <option value="">Pilih karyawan</option>
                      {employees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.position}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Periode Mulai</label>
                      <Input name="pay_period_start" type="date" value={form.pay_period_start} onChange={handleFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Periode Akhir</label>
                      <Input name="pay_period_end" type="date" value={form.pay_period_end} onChange={handleFormChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Gaji Pokok</label>
                      <Input name="gross_salary" type="number" value={form.gross_salary} onChange={handleFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Potongan</label>
                      <Input name="deductions" type="number" value={form.deductions} onChange={handleFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Diterima</label>
                      <Input name="net_salary" type="number" value={form.net_salary} onChange={handleFormChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Bayar</label>
                      <Input name="payment_date" type="date" value={form.payment_date} onChange={handleFormChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select name="status" value={form.status} onChange={handleFormChange} className="border px-2 py-1 rounded w-full" required>
                        <option value="PAID">PAID</option>
                        <option value="UNPAID">UNPAID</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Data Payroll Karyawan</CardTitle>
              <CardDescription>Kelola data payroll seluruh karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="border px-2 py-1 rounded w-64"
                  placeholder="Cari nama, posisi, departemen, status..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                />
                <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
              </div>
              {/* Tabel Payroll */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Potongan</TableHead>
                    <TableHead>Total Diterima</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : pagedPayrolls.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Belum ada data payroll.</TableCell></TableRow>
                  ) : pagedPayrolls.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.employee?.first_name || '-'} {p.employee?.last_name || ''}</TableCell>
                      <TableCell>{p.employee?.position || '-'}</TableCell>
                      <TableCell>{p.pay_period_start} s/d {p.pay_period_end}</TableCell>
                      <TableCell>Rp {Number(p.gross_salary).toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {Number(p.deductions).toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {Number(p.net_salary).toLocaleString('id-ID')}</TableCell>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 