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
      console.log('Fetching employees from:', `${API_URL}/api/employees`);
      const res = await fetch(`${API_URL}/api/employees`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil data karyawan`);
      }
      const data = await res.json();
      console.log('Employees fetched successfully:', data.length, 'records');
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Warning",
        description: error instanceof Error ? error.message : "Gagal mengambil data karyawan",
        variant: "destructive"
      });
    }
  };

  const fetchPayrollComponents = async () => {
    try {
      console.log('Fetching payroll components from:', `${API_URL}/api/payroll-components`);
      const res = await fetch(`${API_URL}/api/payroll-components`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil konfigurasi payroll`);
      }
      const data = await res.json();
      console.log('Payroll components fetched successfully:', data.length, 'records');
      setPayrollComponents(data);
    } catch (error) {
      console.error('Error fetching payroll components:', error);
      toast({
        title: "Warning",
        description: error instanceof Error ? error.message : "Gagal mengambil konfigurasi payroll",
        variant: "destructive"
      });
    }
  };

  const fetchSalaryData = async () => {
    try {
      console.log('Fetching salary data from:', `${API_URL}/api/salary`);
      const res = await fetch(`${API_URL}/api/salary`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil data salary`);
      }
      const data = await res.json();
      console.log('Salary data fetched successfully:', data.length, 'records');
      setSalaryData(data);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast({
        title: "Warning",
        description: error instanceof Error ? error.message : "Gagal mengambil data salary",
        variant: "destructive"
      });
    }
  };

  // Calculate payroll components based on basic salary
  const calculatePayrollComponents = async (basicSalary: number) => {
    if (basicSalary <= 0) {
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
      return;
    }

    // Validasi employee_id harus terisi
    if (!form.employee_id) {
      console.warn('Employee ID not selected, skipping calculation');
      return;
    }
    
    try {
      console.log('Calculating payroll for employee:', form.employee_id, 'with salary:', basicSalary);
      
      const response = await fetch(`${API_URL}/api/payrolls/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: form.employee_id,
          basic_salary: basicSalary,
          manual_deductions: manualDeductions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Gagal menghitung komponen payroll`);
      }

      const data = await response.json();
      
      setCalculatedComponents(data.calculated_components || []);
      
      // Update form with calculated totals
      if (data.totals) {
        setForm(prev => ({
          ...prev,
          gross_salary: data.totals.total_pendapatan || basicSalary,
          deductions: data.totals.total_deduction || 0,
          net_salary: data.totals.net_salary || basicSalary
        }));
      }

      console.log('Backend calculation result:', data);
      
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghitung komponen payroll",
        variant: "destructive"
      });
      
      // Fallback to empty calculation
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
    }
  };



  // Recalculate when payrollComponents are loaded
  useEffect(() => {
    if (form.gross_salary > 0 && payrollComponents.length > 0 && form.employee_id) {
      // Reset calculated components first to prevent accumulation
      setCalculatedComponents([]);
      calculatePayrollComponents(form.gross_salary);
    }
  }, [payrollComponents, form.employee_id]); // Depend on both payrollComponents and employee_id

  // Update totals calculation (simplified - backend handles main calculations)
  const updateTotals = (basicSalary: number, calculated: any[], manual: any) => {
    // This function is now simplified since backend handles the main calculations
    // Only used for fallback cases or when auto-calculation is disabled
    
    if (calculated.length === 0) {
      // Simple fallback calculation
      const totalManualDeduction = manual.kasbon + manual.telat + manual.angsuran_kredit;
      const netSalary = basicSalary - totalManualDeduction;
      
      setForm(prev => ({
        ...prev,
        gross_salary: basicSalary,
        deductions: totalManualDeduction,
        net_salary: netSalary
      }));
      return;
    }
    
    // If we have calculated components, use them (backend already calculated totals)
    const totalManualDeduction = manual.kasbon + manual.telat + manual.angsuran_kredit;
    
    setForm(prev => ({
      ...prev,
      deductions: prev.deductions + totalManualDeduction,
      net_salary: prev.net_salary - totalManualDeduction
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
        const posAllowance = typeof selectedSalary.position_allowance === 'string' ? 
          parseFloat(selectedSalary.position_allowance) || 0 : selectedSalary.position_allowance || 0;
        const mgmtAllowance = typeof selectedSalary.management_allowance === 'string' ? 
          parseFloat(selectedSalary.management_allowance) || 0 : selectedSalary.management_allowance || 0;
        const phoneAllowance = typeof selectedSalary.phone_allowance === 'string' ? 
          parseFloat(selectedSalary.phone_allowance) || 0 : selectedSalary.phone_allowance || 0;
        const incentiveAllowance = typeof selectedSalary.incentive_allowance === 'string' ? 
          parseFloat(selectedSalary.incentive_allowance) || 0 : selectedSalary.incentive_allowance || 0;
        const overtimeAllowance = typeof selectedSalary.overtime_allowance === 'string' ? 
          parseFloat(selectedSalary.overtime_allowance) || 0 : selectedSalary.overtime_allowance || 0;
        
        const totalAllowances = posAllowance + mgmtAllowance + phoneAllowance + incentiveAllowance + overtimeAllowance;
        
        // Total Pendapatan = Gaji Pokok + Tunjangan (TANPA BPJS Perusahaan)
        // BPJS Perusahaan akan dihitung terpisah sebagai komponen payroll
        const totalPendapatan = basicSalary + totalAllowances;
        
        console.log('Selected salary data:', {
          employee_id: value,
          basic_salary: basicSalary,
          allowances: {
            position: posAllowance,
            management: mgmtAllowance,
            phone: phoneAllowance,
            incentive: incentiveAllowance,
            overtime: overtimeAllowance
          },
          total_allowances: totalAllowances,
          total_pendapatan: totalPendapatan
        });
        
        setForm(prev => ({
          ...prev,
          gross_salary: totalPendapatan
        }));
        
        // Calculate payroll components with the total pendapatan (async)
        // Pastikan employee_id sudah terisi sebelum memanggil calculatePayrollComponents
        setTimeout(() => {
          calculatePayrollComponents(totalPendapatan);
        }, 100);
      }
    } else if (field === 'gross_salary') {
      // Hanya hitung jika employee sudah dipilih
      if (form.employee_id) {
        calculatePayrollComponents(Number(value));
      }
    }
  };

  const handleManualDeductionChange = (field: string, value: number) => {
    const newManualDeductions = { ...manualDeductions, [field]: value };
    setManualDeductions(newManualDeductions);
    
    console.log('Manual deduction changed:', field, value, 'for employee:', form.employee_id);
    
    // Recalculate with backend automatically
    if (form.employee_id && form.gross_salary > 0) {
      calculatePayrollComponents(form.gross_salary);
    } else {
      // Fallback to local calculation
      updateTotals(form.gross_salary, calculatedComponents, newManualDeductions);
    }
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

  // Debug logging untuk memeriksa state
  useEffect(() => {
    console.log('Current form state:', form);
    console.log('Current manual deductions:', manualDeductions);
    console.log('Current calculated components:', calculatedComponents);
  }, [form, manualDeductions, calculatedComponents]);

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
                
                {/* Total Pendapatan - Auto-filled from salary data */}
                <div>
                  <Label htmlFor="gross_salary">Total Pendapatan (Gaji + Tunjangan)</Label>
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
                      Otomatis terisi dengan total gaji pokok + semua tunjangan dari data salary
                    </p>
                  )}
                </div>

                {/* Salary Details from Salary Data */}
                {form.employee_id && (() => {
                  const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                  if (selectedSalary) {
                    const basicSalary = typeof selectedSalary.basic_salary === 'string' ? 
                      parseFloat(selectedSalary.basic_salary) || 0 : selectedSalary.basic_salary || 0;
                    const posAllowance = typeof selectedSalary.position_allowance === 'string' ? 
                      parseFloat(selectedSalary.position_allowance) || 0 : selectedSalary.position_allowance || 0;
                    const mgmtAllowance = typeof selectedSalary.management_allowance === 'string' ? 
                      parseFloat(selectedSalary.management_allowance) || 0 : selectedSalary.management_allowance || 0;
                    const phoneAllowance = typeof selectedSalary.phone_allowance === 'string' ? 
                      parseFloat(selectedSalary.phone_allowance) || 0 : selectedSalary.phone_allowance || 0;
                    const incentiveAllowance = typeof selectedSalary.incentive_allowance === 'string' ? 
                      parseFloat(selectedSalary.incentive_allowance) || 0 : selectedSalary.incentive_allowance || 0;
                    const overtimeAllowance = typeof selectedSalary.overtime_allowance === 'string' ? 
                      parseFloat(selectedSalary.overtime_allowance) || 0 : selectedSalary.overtime_allowance || 0;
                    
                    const totalAllowances = posAllowance + mgmtAllowance + phoneAllowance + incentiveAllowance + overtimeAllowance;
                    
                    return (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Detail Gaji dari Data Salary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Gaji Pokok</span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(basicSalary)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Tunjangan Jabatan</span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(posAllowance)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Tunjangan Manajemen</span>
                              <span className="font-semibold text-purple-600">
                                {formatCurrency(mgmtAllowance)}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Tunjangan Telepon</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(phoneAllowance)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Tunjangan Insentif</span>
                              <span className="font-semibold text-yellow-600">
                                {formatCurrency(incentiveAllowance)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border">
                              <span className="font-medium text-gray-700">Tunjangan Lembur</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(overtimeAllowance)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border">
                          <span className="text-lg font-medium text-gray-700">Total Tunjangan</span>
                          <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(totalAllowances)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border">
                          <span className="text-xl font-bold text-gray-800">Total Pendapatan (Gaji + Tunjangan)</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(basicSalary + totalAllowances)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                

                                                                   {/* Calculated Components Display */}
                  {calculatedComponents.length > 0 && (
                   <div className="space-y-6">
                     {/* PENDAPATAN Section */}
                     <div className="space-y-4">
                       <div className="bg-gray-100 px-4 py-3 rounded-lg">
                         <h3 className="text-lg font-bold text-gray-800">PENDAPATAN</h3>
                       </div>
                       
                       {/* PENDAPATAN TETAP */}
                       <div className="space-y-3">
                         <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TETAP</h4>
                         <div className="space-y-2">
                           {calculatedComponents.filter(c => c.type === 'income').map((component, index) => (
                             <div key={index} className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                               <div className="flex-1">
                                 <span className="font-medium text-sm text-gray-800">{component.name}</span>
                                 {component.is_percentage && (
                                   <div className="text-xs text-gray-600 mt-1">
                                     {component.percentage}% dari gaji pokok murni
                                   </div>
                                 )}
                               </div>
                               <span className="text-sm font-bold text-green-700 ml-4">
                                 {formatCurrency(component.amount)}
                               </span>
                             </div>
                           ))}
                         </div>
                         <div className="flex justify-between items-center py-3 px-4 bg-green-100 rounded-lg border border-green-300">
                           <span className="font-semibold text-gray-800">SUB TOTAL</span>
                           <span className="font-bold text-green-800">
                             {formatCurrency(calculatedComponents.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0))}
                           </span>
                         </div>
                       </div>
                       
                       {/* PENDAPATAN TIDAK TETAP */}
                       <div className="space-y-3">
                         <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TIDAK TETAP</h4>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                             <span className="font-medium text-sm text-gray-800">Tunjangan Jabatan</span>
                             <span className="text-sm font-semibold text-blue-700">
                               {(() => {
                                 const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                                 if (selectedSalary) {
                                   const posAllowance = typeof selectedSalary.position_allowance === 'string' ? 
                                     parseFloat(selectedSalary.position_allowance) || 0 : selectedSalary.position_allowance || 0;
                                   return formatCurrency(posAllowance);
                                 }
                                 return formatCurrency(0);
                               })()}
                             </span>
                           </div>
                           <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                             <span className="font-medium text-sm text-gray-800">Tunjangan Pengurus</span>
                             <span className="text-sm font-semibold text-blue-700">
                               {(() => {
                                 const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                                 if (selectedSalary) {
                                   const mgmtAllowance = typeof selectedSalary.management_allowance === 'string' ? 
                                     parseFloat(selectedSalary.management_allowance) || 0 : selectedSalary.management_allowance || 0;
                                   return formatCurrency(mgmtAllowance);
                                 }
                                 return formatCurrency(0);
                               })()}
                             </span>
                           </div>
                           <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                             <span className="font-medium text-sm text-gray-800">Tunjangan Pulsa</span>
                             <span className="text-sm font-semibold text-blue-700">
                               {(() => {
                                 const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                                 if (selectedSalary) {
                                   const phoneAllowance = typeof selectedSalary.phone_allowance === 'string' ? 
                                     parseFloat(selectedSalary.phone_allowance) || 0 : selectedSalary.phone_allowance || 0;
                                   return formatCurrency(phoneAllowance);
                                 }
                                 return formatCurrency(0);
                               })()}
                             </span>
                           </div>
                           <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                             <span className="font-medium text-sm text-gray-800">Tunjangan Insentif</span>
                             <span className="text-sm font-semibold text-blue-700">
                               {(() => {
                                 const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                                 if (selectedSalary) {
                                   const incentiveAllowance = typeof selectedSalary.incentive_allowance === 'string' ? 
                                     parseFloat(selectedSalary.incentive_allowance) || 0 : selectedSalary.incentive_allowance || 0;
                                   return formatCurrency(incentiveAllowance);
                                 }
                                 return formatCurrency(0);
                               })()}
                             </span>
                           </div>
                           <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                             <span className="font-medium text-sm text-gray-800">Tunjangan Lembur</span>
                             <span className="text-sm font-semibold text-blue-700">
                               {(() => {
                                 const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                                 if (selectedSalary) {
                                   const overtimeAllowance = typeof selectedSalary.overtime_allowance === 'string' ? 
                                     parseFloat(selectedSalary.overtime_allowance) || 0 : selectedSalary.overtime_allowance || 0;
                                   return formatCurrency(overtimeAllowance);
                                 }
                                 return formatCurrency(0);
                               })()}
                             </span>
                           </div>
                         </div>
                         <div className="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg border border-blue-300">
                           <span className="font-semibold text-gray-800">SUB TOTAL</span>
                           <span className="font-bold text-blue-800">
                             {(() => {
                               const selectedSalary = salaryData.find(salary => salary.employee_id === form.employee_id);
                               if (selectedSalary) {
                                 const posAllowance = typeof selectedSalary.position_allowance === 'string' ? 
                                   parseFloat(selectedSalary.position_allowance) || 0 : selectedSalary.position_allowance || 0;
                                 const mgmtAllowance = typeof selectedSalary.management_allowance === 'string' ? 
                                   parseFloat(selectedSalary.management_allowance) || 0 : selectedSalary.management_allowance || 0;
                                 const phoneAllowance = typeof selectedSalary.phone_allowance === 'string' ? 
                                   parseFloat(selectedSalary.phone_allowance) || 0 : selectedSalary.phone_allowance || 0;
                                 const incentiveAllowance = typeof selectedSalary.incentive_allowance === 'string' ? 
                                   parseFloat(selectedSalary.incentive_allowance) || 0 : selectedSalary.incentive_allowance || 0;
                                 const overtimeAllowance = typeof selectedSalary.overtime_allowance === 'string' ? 
                                   parseFloat(selectedSalary.overtime_allowance) || 0 : selectedSalary.overtime_allowance || 0;
                                 
                                 const totalAllowances = posAllowance + mgmtAllowance + phoneAllowance + incentiveAllowance + overtimeAllowance;
                                 return formatCurrency(totalAllowances);
                               }
                               return formatCurrency(0);
                             })()}
                           </span>
                         </div>
                       </div>
                       
                       {/* TOTAL PENDAPATAN */}
                       <div className="flex justify-between items-center py-4 px-5 bg-green-200 rounded-lg border-2 border-green-400">
                         <span className="text-xl font-bold text-gray-800">TOTAL PENDAPATAN</span>
                         <span className="text-2xl font-bold text-green-800">
                           {formatCurrency(form.gross_salary)}
                         </span>
                       </div>
                     </div>

                     {/* PEMOTONGAN Section */}
                     <div className="space-y-4">
                       <div className="bg-gray-100 px-4 py-3 rounded-lg">
                         <h3 className="text-lg font-bold text-gray-800">PEMOTONGAN</h3>
                       </div>
                       
                                               {/* PERUSAHAAN */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PERUSAHAAN</h4>
                          <div className="space-y-2">
                            {calculatedComponents.filter(c => c.type === 'income' && c.name.includes('(Perusahaan)')).map((component, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex-1">
                                  <span className="font-medium text-sm text-gray-800">{component.name}</span>
                                  {component.is_percentage && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {component.percentage}% dari gaji pokok murni
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-orange-700 ml-4">
                                  {formatCurrency(component.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 bg-orange-100 rounded-lg border border-orange-300">
                            <span className="font-semibold text-gray-800">SUB TOTAL</span>
                            <span className="font-bold text-orange-800">
                              {formatCurrency(calculatedComponents.filter(c => c.type === 'income' && c.name.includes('(Perusahaan)')).reduce((sum, c) => sum + c.amount, 0))}
                            </span>
                          </div>
                        </div>
                       
                                               {/* KARYAWAN */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">KARYAWAN</h4>
                          <div className="space-y-2">
                            {calculatedComponents.filter(c => c.type === 'deduction' && c.name.includes('(Karyawan)')).map((component, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex-1">
                                  <span className="font-medium text-sm text-gray-800">{component.name}</span>
                                  {component.is_percentage && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {component.percentage}% dari gaji pokok murni
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(component.amount)}
                                </span>
                              </div>
                            ))}
                            
                            {/* Manual Deductions */}
                            {manualDeductions.kasbon > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">KASBON</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(manualDeductions.kasbon)}
                                </span>
                              </div>
                            )}
                            {manualDeductions.angsuran_kredit > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">Angsuran Kredit</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(manualDeductions.angsuran_kredit)}
                                </span>
                              </div>
                            )}
                            {manualDeductions.telat > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">Telat</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(manualDeductions.telat)}
                                </span>
                           </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 bg-red-100 rounded-lg border border-red-300">
                            <span className="font-semibold text-gray-800">SUB TOTAL</span>
                            <span className="font-bold text-red-800">
                              {formatCurrency(calculatedComponents.filter(c => c.type === 'deduction' && c.name.includes('(Karyawan)')).reduce((sum, c) => sum + c.amount, 0) + 
                                manualDeductions.kasbon + manualDeductions.telat + manualDeductions.angsuran_kredit)}
                            </span>
                          </div>
                        </div>
                       
                                               {/* TOTAL PEMOTONGAN */}
                        <div className="flex justify-between items-center py-4 px-5 bg-red-200 rounded-lg border-2 border-red-400">
                          <span className="text-xl font-bold text-gray-800">TOTAL PEMOTONGAN</span>
                          <span className="text-2xl font-bold text-red-800">
                            {formatCurrency(form.deductions)}
                          </span>
                        </div>
                        
                        {/* Komponen Lainnya (jika ada) */}
                        {(() => {
                          const otherComponents = calculatedComponents.filter(c => 
                            !c.name.includes('(Perusahaan)') && 
                            !c.name.includes('(Karyawan)') &&
                            c.type === 'deduction'
                          );
                          
                          if (otherComponents.length > 0) {
                            return (
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">KOMPONEN LAINNYA</h4>
                                <div className="space-y-2">
                                  {otherComponents.map((component, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex-1">
                                        <span className="font-medium text-sm text-gray-800">{component.name}</span>
                                        {component.is_percentage && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            {component.percentage}% dari gaji pokok murni
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 ml-4">
                                        {formatCurrency(component.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                     </div>
                   </div>
                 )}

                {/* Manual Deductions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Input Potongan Manual</h3>
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

                </div>

                                                   {/* Summary Section */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label htmlFor="gross_salary_display">Total Pendapatan</Label>
                      <Input 
                        id="gross_salary_display"
                        type="text" 
                        value={formatCurrency(form.gross_salary)} 
                        readOnly
                        className="bg-white font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Gaji + Tunjangan + Komponen Income</p>
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
                      <p className="text-xs text-gray-500 mt-1">Komponen Deduction + Manual</p>
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
                      <p className="text-xs text-gray-500 mt-1">Total Pendapatan - Total Potongan</p>
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

export default PayrollContent;

