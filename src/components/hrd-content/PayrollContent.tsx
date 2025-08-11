import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { DollarSign, Plus, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || "";

export const PayrollContent = () => {
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollComponents, setPayrollComponents] = useState<any[]>([]);
  const [calculatedComponents, setCalculatedComponents] = useState<any[]>([]);
  const [autoCalculation, setAutoCalculation] = useState(true);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [manualDeductions, setManualDeductions] = useState({
    kasbon: 0,
    telat: 0,
    angsuran_kredit: 0
  });
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
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    totalAmount: 0,
    avgSalary: 0
  });

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payrolls`);
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
        
        // Calculate stats
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPayrolls = data.filter((p: any) => {
          const payrollDate = new Date(p.pay_period_start);
          return payrollDate.getMonth() === thisMonth && payrollDate.getFullYear() === thisYear;
        });
        
        const totalAmount = data.reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
        const avgSalary = data.length > 0 ? totalAmount / data.length : 0;
        
        setStats({
          total: data.length,
          thisMonth: thisMonthPayrolls.length,
          totalAmount,
          avgSalary
        });
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
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

  const fetchSalaryData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/salary`);
      if (!res.ok) throw new Error("Gagal mengambil data salary");
      const data = await res.json();
      setSalaryData(data);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    }
  };

  // Calculate payroll components based on basic salary
  const calculatePayrollComponents = (basicSalary: number) => {
    if (basicSalary <= 0) {
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
      return;
    }

    if (!autoCalculation) {
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
      return;
    }

    const activeComponents = payrollComponents.filter(comp => comp.is_active);
    const calculated: any[] = [];

    activeComponents.forEach(component => {
      let amount = 0;
      let isPercentage = false;

      if (component.percentage > 0) {
        amount = (basicSalary * component.percentage) / 100;
        isPercentage = true;
      } else if (component.amount > 0) {
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
    updateTotals(basicSalary, calculated, manualDeductions);
  };

  // Handle checkbox change
  const handleAutoCalculationChange = (checked: boolean) => {
    setAutoCalculation(checked);
    
    if (checked && form.gross_salary > 0) {
      calculatePayrollComponents(form.gross_salary);
    } else {
      setCalculatedComponents([]);
      updateTotals(form.gross_salary, [], manualDeductions);
    }
  };

  // Recalculate when payrollComponents are loaded
  useEffect(() => {
    if (autoCalculation && form.gross_salary > 0 && payrollComponents.length > 0) {
      calculatePayrollComponents(form.gross_salary);
    }
  }, [payrollComponents, autoCalculation]);

  // Update totals calculation
  const updateTotals = (basicSalary: number, calculated: any[], manual: any) => {
    const totalIncome = calculated
      .filter(c => c.type === 'income')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalAutoDeduction = calculated
      .filter(c => c.type === 'deduction')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalManualDeduction = manual.kasbon + manual.telat + manual.angsuran_kredit;
    const totalDeduction = totalAutoDeduction + totalManualDeduction;
    
    const netSalary = basicSalary + totalIncome - totalDeduction;
    
    setForm(prev => ({
      ...prev,
      gross_salary: basicSalary,
      deductions: totalDeduction,
      net_salary: netSalary
    }));
  };

  const handleFormChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    
    if (field === 'employee_id') {
      // Auto-fill salary data when employee is selected
      const selectedSalary = salaryData.find(salary => salary.employee_id === value);
      if (selectedSalary) {
        const basicSalary = typeof selectedSalary.basic_salary === 'string' ? 
          parseFloat(selectedSalary.basic_salary) || 0 : selectedSalary.basic_salary || 0;
        
        setForm(prev => ({
          ...prev,
          gross_salary: basicSalary
        }));
        
        // Calculate payroll components with the auto-filled salary
        calculatePayrollComponents(basicSalary);
      }
    } else if (field === 'gross_salary') {
      calculatePayrollComponents(Number(value));
    }
  };

  const handleManualDeductionChange = (field: string, value: number) => {
    const newManualDeductions = { ...manualDeductions, [field]: value };
    setManualDeductions(newManualDeductions);
    updateTotals(form.gross_salary, calculatedComponents, newManualDeductions);
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      console.log('Submitting payroll data:', form);
      const res = await fetch(`${API_URL}/api/payrolls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal tambah payroll");
      }
      
      const result = await res.json();
      console.log('Payroll created successfully:', result);
      
      setModalOpen(false);
      setForm({ employee_id: "", pay_period_start: "", pay_period_end: "", gross_salary: 0, deductions: 0, net_salary: 0, payment_date: "", status: "PAID" });
      setCalculatedComponents([]);
      setManualDeductions({ kasbon: 0, telat: 0, angsuran_kredit: 0 });
      fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Payroll berhasil ditambahkan',
      });
    } catch (err: any) {
      console.error('Error adding payroll:', err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal tambah payroll',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchPayrollComponents();
    fetchSalaryData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Management Payroll</h2>
          <p className="text-gray-600">Kelola data gaji dan pembayaran karyawan</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                
                {/* Basic Salary - Auto-filled from salary data */}
                <div>
                  <Label htmlFor="gross_salary">Gaji Pokok</Label>
                  <Input 
                    id="gross_salary"
                    type="number" 
                    value={form.gross_salary} 
                    onChange={(e) => handleFormChange('gross_salary', Number(e.target.value))} 
                    required 
                    placeholder="Otomatis terisi dari data salary"
                    className="bg-gray-50"
                    readOnly={form.employee_id !== ""}
                  />
                  {form.employee_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Data diambil otomatis dari data salary karyawan
                    </p>
                  )}
                </div>

                {/* Auto Calculation Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto_calculation" 
                    checked={autoCalculation}
                    onCheckedChange={handleAutoCalculationChange}
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
                        {calculatedComponents.filter(c => c.type === 'deduction').map((component, index) => (
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
                        {calculatedComponents.filter(c => c.type === 'income').map((component, index) => (
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

                {/* Manual Deductions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Potongan Manual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="kasbon">KASBON</Label>
                      <Input 
                        id="kasbon"
                        type="number" 
                        value={manualDeductions.kasbon} 
                        onChange={(e) => handleManualDeductionChange('kasbon', Number(e.target.value))} 
                        placeholder="0"
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(manualDeductions.kasbon)}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="telat">Telat</Label>
                      <Input 
                        id="telat"
                        type="number" 
                        value={manualDeductions.telat} 
                        onChange={(e) => handleManualDeductionChange('telat', Number(e.target.value))} 
                        placeholder="0"
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(manualDeductions.telat)}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="angsuran_kredit">Angsuran Kredit</Label>
                      <Input 
                        id="angsuran_kredit"
                        type="number" 
                        value={manualDeductions.angsuran_kredit} 
                        onChange={(e) => handleManualDeductionChange('angsuran_kredit', Number(e.target.value))} 
                        placeholder="0"
                        min="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(manualDeductions.angsuran_kredit)}
                      </div>
                    </div>
                  </div>
                  {(manualDeductions.kasbon > 0 || manualDeductions.telat > 0 || manualDeductions.angsuran_kredit > 0) && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm text-red-800">Total Potongan Manual</span>
                        <span className="text-sm font-semibold text-red-600">
                          - {formatCurrency(manualDeductions.kasbon + manualDeductions.telat + manualDeductions.angsuran_kredit)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Records payroll</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Payroll processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Total amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Gaji</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgSalary)}</div>
            <p className="text-xs text-muted-foreground">Average salary</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payrolls */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Terbaru</CardTitle>
          <CardDescription>Daftar payroll yang baru diproses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data payroll
            </div>
          ) : (
            <div className="space-y-4">
              {payrolls.slice(0, 5).map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {payroll.employee?.first_name} {payroll.employee?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {payroll.pay_period_start} - {payroll.pay_period_end}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payroll.net_salary)}</div>
                    <div className={`text-sm ${payroll.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                      {payroll.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};