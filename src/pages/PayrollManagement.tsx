import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2, Settings, Plus, Search, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || "";

interface PayrollComponent {
  id: number;
  name: string;
  type: 'income' | 'deduction';
  category: 'fixed' | 'variable' | 'bpjs' | 'allowance';
  percentage: number;
  amount: number;
  is_active: boolean;
  description: string;
}

interface CalculatedComponent {
  name: string;
  type: 'income' | 'deduction';
  amount: number;
  percentage: number;
  is_percentage: boolean;
}

// Format currency to Indonesian format
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace('IDR', 'Rp ').trim();
};

export default function PayrollManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([]);
  const [calculatedComponents, setCalculatedComponents] = useState<CalculatedComponent[]>([]);
  const [autoCalculation, setAutoCalculation] = useState(true);
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

  const fetchPayrollComponents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/payroll-components`);
      if (!res.ok) throw new Error("Gagal mengambil konfigurasi payroll");
      const data = await res.json();
      setPayrollComponents(data);
    } catch (error) {
      console.error('Error fetching payroll components:', error);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchPayrollComponents();
  }, []);

  // Calculate payroll components based on basic salary
  const calculatePayrollComponents = (basicSalary: number) => {
    if (basicSalary <= 0 || !autoCalculation) {
      setCalculatedComponents([]);
      return;
    }

    const activeComponents = payrollComponents.filter(comp => comp.is_active);
    const calculated: CalculatedComponent[] = [];

    activeComponents.forEach(component => {
      let amount = 0;
      let isPercentage = false;

      if (component.percentage > 0) {
        // Calculate based on percentage
        amount = (basicSalary * component.percentage) / 100;
        isPercentage = true;
      } else if (component.amount > 0) {
        // Use fixed amount
        amount = component.amount;
        isPercentage = false;
      }

      calculated.push({
        name: component.name,
        type: component.type,
        amount: amount,
        percentage: component.percentage,
        is_percentage: isPercentage
      });
    });

    setCalculatedComponents(calculated);
    
    // Calculate totals
    const totalIncome = calculated
      .filter(c => c.type === 'income')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalDeduction = calculated
      .filter(c => c.type === 'deduction')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const netSalary = basicSalary + totalIncome - totalDeduction;
    
    setForm(prev => ({
      ...prev,
      gross_salary: basicSalary,
      deductions: totalDeduction,
      net_salary: netSalary
    }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin hapus payroll ini?")) return;
    try {
      const res = await fetch(`${API_URL}/api/payrolls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus payroll");
      fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Payroll berhasil dihapus',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Gagal hapus payroll',
        variant: 'destructive',
      });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    
    // If basic salary changes, recalculate components
    if (field === 'gross_salary' && autoCalculation) {
      calculatePayrollComponents(Number(value));
    }
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
      setCalculatedComponents([]);
      fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Payroll berhasil ditambahkan',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Gagal tambah payroll',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Search & Pagination
  const filteredPayrolls = payrolls.filter((p) => {
    const searchTerm = search.toLowerCase();
    return (
      p.employee?.first_name?.toLowerCase().includes(searchTerm) ||
      p.employee?.last_name?.toLowerCase().includes(searchTerm) ||
      p.employee?.position?.toLowerCase().includes(searchTerm) ||
      p.employee?.department?.toLowerCase().includes(searchTerm) ||
      p.status?.toLowerCase().includes(searchTerm)
    );
  });

  const totalPages = Math.ceil(filteredPayrolls.length / pageSize);
  const pagedPayrolls = filteredPayrolls.slice((page - 1) * pageSize, page * pageSize);

  // Group components by type for better display
  const incomeComponents = calculatedComponents.filter(c => c.type === 'income');
  const deductionComponents = calculatedComponents.filter(c => c.type === 'deduction');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Management Payroll</h1>
                <p className="text-gray-600">Kelola data gaji, slip gaji, dan histori pembayaran karyawan</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/payroll-configuration')}>
                <Settings className="w-4 h-4 mr-2" />
                Konfigurasi Payroll
              </Button>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tambah Payroll Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPayroll} className="space-y-6">
                    {/* Employee Selection */}
                    <div>
                      <Label htmlFor="employee_id">Pilih Karyawan</Label>
                      <Select value={form.employee_id} onValueChange={(value) => handleFormChange('employee_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih karyawan" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name} - {emp.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Period */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pay_period_start">Periode Mulai</Label>
                        <Input 
                          id="pay_period_start"
                          type="date" 
                          value={form.pay_period_start} 
                          onChange={(e) => handleFormChange('pay_period_start', e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="pay_period_end">Periode Akhir</Label>
                        <Input 
                          id="pay_period_end"
                          type="date" 
                          value={form.pay_period_end} 
                          onChange={(e) => handleFormChange('pay_period_end', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    
                    {/* Basic Salary */}
                    <div>
                      <Label htmlFor="gross_salary">Gaji Pokok</Label>
                      <Input 
                        id="gross_salary"
                        type="number" 
                        value={form.gross_salary} 
                        onChange={(e) => handleFormChange('gross_salary', Number(e.target.value))} 
                        required 
                        placeholder="Masukkan gaji pokok"
                      />
                    </div>

                    {/* Auto Calculation Toggle */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="auto_calculation" 
                        checked={autoCalculation}
                        onCheckedChange={(checked) => {
                          setAutoCalculation(checked as boolean);
                          if (checked && form.gross_salary > 0) {
                            calculatePayrollComponents(form.gross_salary);
                          } else {
                            setCalculatedComponents([]);
                          }
                        }}
                      />
                      <Label htmlFor="auto_calculation" className="text-sm font-medium">
                        Komponen Perhitungan Otomatik
                      </Label>
                    </div>

                    {/* Calculated Components Display */}
                    {calculatedComponents.length > 0 && autoCalculation && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column - Employee Deductions */}
                          <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Karyawan</h3>
                            {deductionComponents.map((component, index) => (
                              <div key={index} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <span className="font-medium text-sm">{component.name}</span>
                                  {component.is_percentage && (
                                    <div className="text-xs text-gray-500">
                                      {component.percentage}% dari gaji pokok
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-red-600">
                                  - {formatCurrency(component.amount)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Right Column - Company Contributions */}
                          <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Perusahaan</h3>
                            {incomeComponents.map((component, index) => (
                              <div key={index} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <span className="font-medium text-sm">{component.name}</span>
                                  {component.is_percentage && (
                                    <div className="text-xs text-gray-500">
                                      {component.percentage}% dari gaji pokok
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                  + {formatCurrency(component.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Section */}
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <Label htmlFor="gross_salary_display">Gaji Pokok</Label>
                        <Input 
                          id="gross_salary_display"
                          type="text" 
                          value={formatCurrency(form.gross_salary)} 
                          readOnly
                          className="bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deductions">Total Potongan</Label>
                        <Input 
                          id="deductions"
                          type="text" 
                          value={formatCurrency(form.deductions)} 
                          readOnly
                          className="bg-white font-semibold text-red-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="net_salary">Total Diterima</Label>
                        <Input 
                          id="net_salary"
                          type="text" 
                          value={formatCurrency(form.net_salary)} 
                          readOnly
                          className="bg-white font-semibold text-green-600"
                        />
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment_date">Tanggal Bayar</Label>
                        <Input 
                          id="payment_date"
                          type="date" 
                          value={form.payment_date} 
                          onChange={(e) => handleFormChange('payment_date', e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={form.status} onValueChange={(value) => handleFormChange('status', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PAID">PAID</SelectItem>
                            <SelectItem value="UNPAID">UNPAID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
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
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    className="pl-10"
                    placeholder="Cari nama, posisi, departemen, status..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                  />
                </div>
                <Button onClick={() => { setSearch(searchInput); setPage(1); }}>
                  Cari
                </Button>
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
                      <TableCell>{formatCurrency(Number(p.gross_salary))}</TableCell>
                      <TableCell>{formatCurrency(Number(p.deductions))}</TableCell>
                      <TableCell>{formatCurrency(Number(p.net_salary))}</TableCell>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-4 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 1}
                >
                  &lt; Sebelumnya
                </Button>
                <span>Halaman {page} dari {totalPages}</span>
                <Button 
                  variant="outline" 
                  onClick={() => setPage(page + 1)} 
                  disabled={page === totalPages}
                >
                  Selanjutnya &gt;
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 