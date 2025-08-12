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
import { useAuth } from '@/hooks/useAuth';

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
  category: 'fixed' | 'variable' | 'bpjs' | 'allowance';
}

interface ManualDeduction {
  kasbon: number;
  telat: number;
  angsuran_kredit: number;
}

// Format currency to Indonesian format
const formatCurrency = (amount: number | null | undefined): string => {
  // Handle null, undefined, or non-number values
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  
  const numAmount = Number(amount);
  if (numAmount === 0) {
    return 'Rp 0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount).replace('IDR', 'Rp ').trim();
};

const getTotalManualDeductions = (manualDeductions: ManualDeduction): number => {
  return manualDeductions.kasbon + manualDeductions.telat + manualDeductions.angsuran_kredit;
};

export default function PayrollManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>([]);
  const [calculatedComponents, setCalculatedComponents] = useState<CalculatedComponent[]>([]);
  const [autoCalculation, setAutoCalculation] = useState(true);
  const [manualDeductions, setManualDeductions] = useState<ManualDeduction>({
    kasbon: 0,
    telat: 0,
    angsuran_kredit: 0
  });
  const [form, setForm] = useState({
    employee_id: "",
    pay_period_start: "",
    pay_period_end: "",
    basic_salary: 0,
    gross_salary: 0,
    net_salary: 0,
    payment_date: "",
    status: "PAID",
    
    // Tunjangan dari Data Salary
    position_allowance: 0,
    management_allowance: 0,
    phone_allowance: 0,
    incentive_allowance: 0,
    overtime_allowance: 0,
    total_allowances: 0,
    
    // Komponen Payroll yang Dihitung - Perusahaan (PENDAPATAN TETAP)
    bpjs_health_company: 0,
    jht_company: 0,
    jkk_company: 0,
    jkm_company: 0,
    jp_company: 0,
    subtotal_company: 0,  // SUB TOTAL (Perusahaan)
    
    // Komponen Payroll yang Dihitung - Karyawan (POTONGAN)
    bpjs_health_employee: 0,
    jht_employee: 0,
    jp_employee: 0,
    subtotal_employee: 0,  // SUB TOTAL (Potongan Karyawan)
    
    // Pajak
    pph21: 0,
    
    // Deductions Manual
    kasbon: 0,
    telat: 0,
    angsuran_kredit: 0,
    
    // Total Deductions
    total_deductions: 0,
    
    // Total Pendapatan (Gaji + Tunjangan + BPJS Perusahaan)
    total_pendapatan: 0,
    
            // Additional fields
        created_by: user?.id,
        approved_by: null,
        approved_at: null
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

  const fetchEmployeeSalary = async (employeeId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/salary/employee/${employeeId}`);
      if (!res.ok) {
        console.log('No salary data found for employee:', employeeId);
        return null;
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching employee salary:', error);
      return null;
    }
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
    console.log('=== calculatePayrollComponents CALLED ===');
    console.log('basicSalary:', basicSalary);
    console.log('autoCalculation:', autoCalculation);
    console.log('payrollComponents:', payrollComponents);
    console.log('payrollComponents.length:', payrollComponents.length);
    
    if (basicSalary <= 0) {
      console.log('Basic salary <= 0, clearing components');
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
      return;
    }

    if (!autoCalculation) {
      console.log('Auto calculation disabled, clearing components');
      setCalculatedComponents([]);
      updateTotals(basicSalary, [], manualDeductions);
      return;
    }

    const activeComponents = payrollComponents.filter(comp => comp.is_active);
    console.log('Active components:', activeComponents);
    console.log('Active components count:', activeComponents.length);
    
    const calculated: CalculatedComponent[] = [];

    activeComponents.forEach(component => {
      let amount = 0;
      let isPercentage = false;

      if (component.percentage > 0) {
        // Calculate based on percentage
        amount = (basicSalary * component.percentage) / 100;
        isPercentage = true;
        console.log(`Component ${component.name}: ${component.percentage}% of ${basicSalary} = ${amount}`);
      } else if (component.amount > 0) {
        // Use fixed amount
        amount = component.amount;
        isPercentage = false;
        console.log(`Component ${component.name}: fixed amount = ${amount}`);
      }

      calculated.push({
        name: component.name,
        type: component.type,
        amount: amount,
        percentage: component.percentage,
        is_percentage: isPercentage,
        category: component.category
      });
    });

    console.log('Final calculated components:', calculated);
    console.log('==========================================');
    
    setCalculatedComponents(calculated);
    updateTotals(basicSalary, calculated, manualDeductions);
  };

  // Update totals calculation
  const updateTotals = (basicSalary: number, calculated: CalculatedComponent[], manual: ManualDeduction) => {
    // Calculate total allowances (PENDAPATAN TIDAK TETAP)
    const totalAllowances = calculated
      .filter(c => c.type === 'income' && c.category === 'allowance')
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Calculate company contributions (PENDAPATAN TETAP - Perusahaan)
    const companyContributions = calculated
      .filter(c => c.type === 'income' && c.category === 'bpjs')
      .reduce((sum, c) => sum + c.amount, 0);
    
    // Calculate employee deductions (Pemotongan - Karyawan)
    const employeeDeductions = calculated
      .filter(c => c.type === 'deduction' && c.category === 'bpjs')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalManualDeduction = manual.kasbon + manual.telat + manual.angsuran_kredit;
    const totalDeduction = employeeDeductions + totalManualDeduction;
    
    // Calculate gross salary (basic salary + allowances)
    const grossSalary = basicSalary + totalAllowances;
    
    // Calculate total pendapatan (gaji + tunjangan + BPJS perusahaan)
    const totalPendapatan = basicSalary + totalAllowances + companyContributions;
    
    // Calculate net salary
    const netSalary = totalPendapatan - totalDeduction;
    
    // Map calculated components to specific fields
    const bpjsHealthCompany = calculated.find(c => c.name === 'BPJS Kesehatan (Perusahaan)' && c.type === 'income')?.amount || 0;
    const jhtCompany = calculated.find(c => c.name === 'BPJS Ketenagakerjaan JHT (Perusahaan)' && c.type === 'income')?.amount || 0;
    const jkkCompany = calculated.find(c => c.name === 'BPJS Ketenagakerjaan JKK (Perusahaan)' && c.type === 'income')?.amount || 0;
    const jkmCompany = calculated.find(c => c.name === 'BPJS Ketenagakerjaan JKM (Perusahaan)' && c.type === 'income')?.amount || 0;
    const jpCompany = calculated.find(c => c.name === 'BPJS Jaminan Pensiun (Perusahaan)' && c.type === 'income')?.amount || 0;
    
    const bpjsHealthEmployee = calculated.find(c => c.name === 'BPJS Kesehatan (Karyawan)' && c.type === 'deduction')?.amount || 0;
    const jhtEmployee = calculated.find(c => c.name === 'BPJS Ketenagakerjaan JHT (Karyawan)' && c.type === 'deduction')?.amount || 0;
    const jpEmployee = calculated.find(c => c.name === 'BPJS Jaminan Pensiun (Karyawan)' && c.type === 'deduction')?.amount || 0;
    
    const positionAllowance = calculated.find(c => c.name === 'Tunjangan Jabatan' && c.type === 'income')?.amount || 0;
    const managementAllowance = calculated.find(c => c.name === 'Tunjangan Pengurus' && c.type === 'income')?.amount || 0;
    const phoneAllowance = calculated.find(c => c.name === 'Tunjangan Pulsa' && c.type === 'income')?.amount || 0;
    const incentiveAllowance = calculated.find(c => c.name === 'Tunjangan Insentif' && c.type === 'income')?.amount || 0;
    const overtimeAllowance = calculated.find(c => c.name === 'Tunjangan Lembur' && c.type === 'income')?.amount || 0;
    
    // Calculate subtotals
    const subtotalCompany = bpjsHealthCompany + jhtCompany + jkkCompany + jkmCompany + jpCompany;
    const subtotalEmployee = bpjsHealthEmployee + jhtEmployee + jpEmployee;
    
    // Debug logging
    console.log('=== DEBUG PAYROLL CALCULATION ===');
    console.log('Basic Salary:', basicSalary);
    console.log('Total Allowances:', totalAllowances);
    console.log('Company Contributions:', companyContributions);
    console.log('Employee Deductions:', employeeDeductions);
    console.log('Manual Deductions:', totalManualDeduction);
    console.log('Gross Salary:', grossSalary);
    console.log('Total Pendapatan:', totalPendapatan);
    console.log('Total Deductions:', totalDeduction);
    console.log('Net Salary:', netSalary);
    console.log('Subtotal Company:', subtotalCompany);
    console.log('Subtotal Employee:', subtotalEmployee);
    console.log('BPJS Components:', {
      bpjsHealthCompany,
      jhtCompany,
      jkkCompany,
      jkmCompany,
      jpCompany
    });
    console.log('================================');
    
    setForm(prev => ({
      ...prev,
      basic_salary: basicSalary,
      gross_salary: grossSalary,
      total_deductions: totalDeduction,
      net_salary: netSalary,
      
      // Tunjangan dari Data Salary
      position_allowance: positionAllowance,
      management_allowance: managementAllowance,
      phone_allowance: phoneAllowance,
      incentive_allowance: incentiveAllowance,
      overtime_allowance: overtimeAllowance,
      total_allowances: totalAllowances,
      
      // Komponen Payroll yang Dihitung - Perusahaan
      bpjs_health_company: bpjsHealthCompany,
      jht_company: jhtCompany,
      jkk_company: jkkCompany,
      jkm_company: jkmCompany,
      jp_company: jpCompany,
      subtotal_company: subtotalCompany,
      
      // Komponen Payroll yang Dihitung - Karyawan
      bpjs_health_employee: bpjsHealthEmployee,
      jht_employee: jhtEmployee,
      jp_employee: jpEmployee,
      subtotal_employee: subtotalEmployee,
      
      // Deductions Manual
      kasbon: manual.kasbon,
      telat: manual.telat,
      angsuran_kredit: manual.angsuran_kredit,
      
      // Total Pendapatan (Gaji + Tunjangan + BPJS Perusahaan)
      total_pendapatan: totalPendapatan,
      
      // Additional fields
      created_by: user?.id,
      approved_by: null,
      approved_at: null
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

  const handleFormChange = async (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    
    // If employee_id changes, fetch employee salary data
    if (field === 'employee_id' && value) {
      const salaryData = await fetchEmployeeSalary(value);
      if (salaryData) {
        setForm(prev => ({
          ...prev,
          basic_salary: Number(salaryData.basic_salary) || 0,
          position_allowance: Number(salaryData.position_allowance) || 0,
          management_allowance: Number(salaryData.management_allowance) || 0,
          phone_allowance: Number(salaryData.phone_allowance) || 0,
          incentive_allowance: Number(salaryData.incentive_allowance) || 0,
          overtime_allowance: Number(salaryData.overtime_allowance) || 0,
          total_allowances: (
            Number(salaryData.position_allowance || 0) +
            Number(salaryData.management_allowance || 0) +
            Number(salaryData.phone_allowance || 0) +
            Number(salaryData.incentive_allowance || 0) +
            Number(salaryData.overtime_allowance || 0)
          )
        }));
        
        // Recalculate payroll components with new basic salary
        if (autoCalculation) {
          calculatePayrollComponents(Number(salaryData.basic_salary));
          // Also update totals to ensure form state is updated
          setTimeout(() => {
            updateTotals(Number(salaryData.basic_salary), calculatedComponents, manualDeductions);
          }, 100);
        }
      }
    }
    
    // If basic salary changes, recalculate components
    if (field === 'basic_salary') {
      calculatePayrollComponents(Number(value));
    }
  };

  const handleManualDeductionChange = (field: keyof ManualDeduction, value: number) => {
    // Validasi: manual deduction tidak boleh melebihi total diterima
    const currentTotalManualDeductions = getTotalManualDeductions(manualDeductions) - manualDeductions[field] + value;
    
    if (currentTotalManualDeductions > form.net_salary) {
      toast({
        title: "Validasi Gagal",
        description: `Total potongan manual (${formatCurrency(currentTotalManualDeductions)}) tidak boleh melebihi total diterima (${formatCurrency(form.net_salary)})`,
        variant: "destructive"
      });
      return;
    }
    
    const newManualDeductions = { ...manualDeductions, [field]: value };
    setManualDeductions(newManualDeductions);
    
    // Recalculate totals with new manual deductions
    updateTotals(form.basic_salary, calculatedComponents, newManualDeductions);
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Debug: Check what we have before calculation
      console.log('=== DEBUG BEFORE CALCULATION ===');
      console.log('form.basic_salary:', form.basic_salary);
      console.log('calculatedComponents:', calculatedComponents);
      console.log('calculatedComponents.length:', calculatedComponents.length);
      console.log('manualDeductions:', manualDeductions);
      console.log('user:', user);
      console.log('user?.id:', user?.id);
      console.log('================================');
      
      // Calculate all values before submitting
      const totalAllowances = calculatedComponents
        .filter(c => c.type === 'income' && c.category === 'allowance')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const companyContributions = calculatedComponents
        .filter(c => c.type === 'income' && c.category === 'bpjs')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const employeeDeductions = calculatedComponents
        .filter(c => c.type === 'deduction' && c.category === 'bpjs')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const totalManualDeduction = manualDeductions.kasbon + manualDeductions.telat + manualDeductions.angsuran_kredit;
      const totalDeduction = employeeDeductions + totalManualDeduction;
      
      const grossSalary = form.basic_salary + totalAllowances;
      const totalPendapatan = form.basic_salary + totalAllowances + companyContributions;
      const netSalary = totalPendapatan - totalDeduction;
      
      // Debug: Check calculated values
      console.log('=== DEBUG CALCULATED VALUES ===');
      console.log('totalAllowances:', totalAllowances);
      console.log('companyContributions:', companyContributions);
      console.log('employeeDeductions:', employeeDeductions);
      console.log('totalManualDeduction:', totalManualDeduction);
      console.log('totalDeduction:', totalDeduction);
      console.log('grossSalary:', grossSalary);
      console.log('totalPendapatan:', totalPendapatan);
      console.log('netSalary:', netSalary);
      console.log('================================');
      
      // Map calculated components to specific fields
      const bpjsHealthCompany = calculatedComponents.find(c => c.name === 'BPJS Kesehatan (Perusahaan)' && c.type === 'income')?.amount || 0;
      const jhtCompany = calculatedComponents.find(c => c.name === 'BPJS Ketenagakerjaan JHT (Perusahaan)' && c.type === 'income')?.amount || 0;
      const jkkCompany = calculatedComponents.find(c => c.name === 'BPJS Ketenagakerjaan JKK (Perusahaan)' && c.type === 'income')?.amount || 0;
      const jkmCompany = calculatedComponents.find(c => c.name === 'BPJS Ketenagakerjaan JKM (Perusahaan)' && c.type === 'income')?.amount || 0;
      const jpCompany = calculatedComponents.find(c => c.name === 'BPJS Jaminan Pensiun (Perusahaan)' && c.type === 'income')?.amount || 0;
      
      const bpjsHealthEmployee = calculatedComponents.find(c => c.name === 'BPJS Kesehatan (Karyawan)' && c.type === 'deduction')?.amount || 0;
      const jhtEmployee = calculatedComponents.find(c => c.name === 'BPJS Ketenagakerjaan JHT (Karyawan)' && c.type === 'deduction')?.amount || 0;
      const jpEmployee = calculatedComponents.find(c => c.name === 'BPJS Jaminan Pensiun (Karyawan)' && c.type === 'deduction')?.amount || 0;
      
      const positionAllowance = calculatedComponents.find(c => c.name === 'Tunjangan Jabatan' && c.type === 'income')?.amount || 0;
      const managementAllowance = calculatedComponents.find(c => c.name === 'Tunjangan Pengurus' && c.type === 'income')?.amount || 0;
      const phoneAllowance = calculatedComponents.find(c => c.name === 'Tunjangan Pulsa' && c.type === 'income')?.amount || 0;
      const incentiveAllowance = calculatedComponents.find(c => c.name === 'Tunjangan Insentif' && c.type === 'income')?.amount || 0;
      const overtimeAllowance = calculatedComponents.find(c => c.name === 'Tunjangan Lembur' && c.type === 'income')?.amount || 0;
      
      // Debug: Check mapped values
      console.log('=== DEBUG MAPPED VALUES ===');
      console.log('BPJS Company:', { bpjsHealthCompany, jhtCompany, jkkCompany, jkmCompany, jpCompany });
      console.log('BPJS Employee:', { bpjsHealthEmployee, jhtEmployee, jpEmployee });
      console.log('Allowances:', { positionAllowance, managementAllowance, phoneAllowance, incentiveAllowance, overtimeAllowance });
      console.log('================================');
      
      // Calculate subtotals
      const subtotalCompany = bpjsHealthCompany + jhtCompany + jkkCompany + jkmCompany + jpCompany;
      const subtotalEmployee = bpjsHealthEmployee + jhtEmployee + jpEmployee;
      
      // Debug: Check subtotals
      console.log('=== DEBUG SUBTOTALS ===');
      console.log('subtotalCompany:', subtotalCompany);
      console.log('subtotalEmployee:', subtotalEmployee);
      console.log('================================');
      
      // Create the complete payroll data object
      const payrollData = {
        ...form,
        gross_salary: grossSalary,
        net_salary: netSalary,
        
        // Tunjangan dari Data Salary
        position_allowance: positionAllowance,
        management_allowance: managementAllowance,
        phone_allowance: phoneAllowance,
        incentive_allowance: incentiveAllowance,
        overtime_allowance: overtimeAllowance,
        total_allowances: totalAllowances,
        
        // Komponen Payroll yang Dihitung - Perusahaan
        bpjs_health_company: bpjsHealthCompany,
        jht_company: jhtCompany,
        jkk_company: jkkCompany,
        jkm_company: jkmCompany,
        jp_company: jpCompany,
        subtotal_company: subtotalCompany,
        
        // Komponen Payroll yang Dihitung - Karyawan
        bpjs_health_employee: bpjsHealthEmployee,
        jht_employee: jhtEmployee,
        jp_employee: jpEmployee,
        subtotal_employee: subtotalEmployee,
        
        // Deductions Manual
        kasbon: manualDeductions.kasbon,
        telat: manualDeductions.telat,
        angsuran_kredit: manualDeductions.angsuran_kredit,
        
        // Total Deductions
        total_deductions: totalDeduction,
        
        // Total Pendapatan (Gaji + Tunjangan + BPJS Perusahaan)
        total_pendapatan: totalPendapatan,
        
        // Additional fields
        created_by: user?.id,
        approved_by: null,
        approved_at: null
      };
      
      console.log('=== CALCULATED PAYROLL DATA ===');
      console.log('Payroll data to be sent:', payrollData);
      console.log('================================');
      
      const res = await fetch(`${API_URL}/api/payrolls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payrollData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal tambah payroll");
      }
      
      const result = await res.json();
      console.log('Payroll created successfully:', result);
      
      setModalOpen(false);
      setForm({ 
        employee_id: "", 
        pay_period_start: "", 
        pay_period_end: "", 
        basic_salary: 0,
        gross_salary: 0, 
        net_salary: 0, 
        payment_date: "", 
        status: "PAID",
        
        // Tunjangan dari Data Salary
        position_allowance: 0,
        management_allowance: 0,
        phone_allowance: 0,
        incentive_allowance: 0,
        overtime_allowance: 0,
        total_allowances: 0,
        
        // Komponen Payroll yang Dihitung - Perusahaan
        bpjs_health_company: 0,
        jht_company: 0,
        jkk_company: 0,
        jkm_company: 0,
        jp_company: 0,
        subtotal_company: 0,
        
        // Komponen Payroll yang Dihitung - Karyawan
        bpjs_health_employee: 0,
        jht_employee: 0,
        jp_employee: 0,
        subtotal_employee: 0,
        
        // Pajak
        pph21: 0,
        
        // Deductions Manual
        kasbon: 0,
        telat: 0,
        angsuran_kredit: 0,
        
        // Total Deductions
        total_deductions: 0,
        
        // Total Pendapatan (Gaji + Tunjangan + BPJS Perusahaan)
        total_pendapatan: 0,
        
        // Additional fields
        created_by: user?.id,
        approved_by: null,
        approved_at: null
      });
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
                          value={form.pay_period_start || ''} 
                          onChange={(e) => handleFormChange('pay_period_start', e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="pay_period_end">Periode Akhir</Label>
                        <Input 
                          id="pay_period_end"
                          type="date" 
                          value={form.pay_period_end || ''} 
                          onChange={(e) => handleFormChange('pay_period_end', e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    
                    {/* Basic Salary */}
                    <div>
                      <Label htmlFor="basic_salary">Gaji Pokok</Label>
                      <Input 
                        id="basic_salary"
                        type="number" 
                        value={form.basic_salary} 
                        onChange={(e) => handleFormChange('basic_salary', Number(e.target.value))} 
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
                          if (checked && form.basic_salary > 0) {
                            calculatePayrollComponents(form.basic_salary);
                          } else {
                            setCalculatedComponents([]);
                            updateTotals(form.basic_salary, [], manualDeductions);
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
                            className={manualDeductions.kasbon > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary ? 'border-red-500' : ''}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(manualDeductions.kasbon)}
                          </div>
                          {manualDeductions.kasbon > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ Melebihi batas maksimal
                            </div>
                          )}
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
                            className={manualDeductions.telat > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary ? 'border-red-500' : ''}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(manualDeductions.telat)}
                          </div>
                          {manualDeductions.telat > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ Melebihi batas maksimal
                            </div>
                          )}
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
                            className={manualDeductions.angsuran_kredit > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary ? 'border-red-500' : ''}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(manualDeductions.angsuran_kredit)}
                          </div>
                          {manualDeductions.angsuran_kredit > 0 && getTotalManualDeductions(manualDeductions) > form.net_salary && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ Melebihi batas maksimal
                            </div>
                          )}
                        </div>
                      </div>
                      {(manualDeductions.kasbon > 0 || manualDeductions.telat > 0 || manualDeductions.angsuran_kredit > 0) && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-red-800">Total Potongan Manual</span>
                            <span className="text-sm font-semibold text-red-600">
                              - {formatCurrency(getTotalManualDeductions(manualDeductions))}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Warning message for total deductions */}
                      {getTotalManualDeductions(manualDeductions) > form.net_salary && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center text-red-700">
                            <span className="text-sm font-medium">
                              ⚠️ Total potongan manual ({formatCurrency(getTotalManualDeductions(manualDeductions))}) melebihi total diterima ({formatCurrency(form.net_salary)})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Section */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 border-b pb-2">Ringkasan Perhitungan</h3>
                      
                      {/* Basic Salary and Allowances */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="basic_salary_display">Gaji Pokok</Label>
                          <Input 
                            id="basic_salary_display"
                            type="text" 
                            value={formatCurrency(form.basic_salary)} 
                            readOnly
                            className="bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <Label htmlFor="total_allowances_display">Total Tunjangan</Label>
                          <Input 
                            id="total_allowances_display"
                            type="text" 
                            value={formatCurrency(form.total_allowances)} 
                            readOnly
                            className="bg-white font-semibold text-blue-600"
                          />
                        </div>
                      </div>
                      
                      {/* Total Pendapatan (Gaji + Tunjangan) */}
                      <div>
                        <Label htmlFor="gross_salary_display">Total Pendapatan (Gaji + Tunjangan)</Label>
                        <Input 
                          id="gross_salary_display"
                          type="text" 
                          value={formatCurrency(form.gross_salary)} 
                          readOnly
                          className="bg-white font-semibold text-green-600"
                        />
                      </div>
                      
                      {/* BPJS Perusahaan - PENDAPATAN TETAP */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">PENDAPATAN TETAP (Perusahaan)</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>BPJS Ketenagakerjaan JHT: {formatCurrency(form.jht_company)}</div>
                          <div>BPJS Ketenagakerjaan JKM: {formatCurrency(form.jkm_company)}</div>
                          <div>BPJS Ketenagakerjaan JKK: {formatCurrency(form.jkk_company)}</div>
                          <div>BPJS Jaminan Pensiun: {formatCurrency(form.jp_company)}</div>
                          <div>BPJS Kesehatan: {formatCurrency(form.bpjs_health_company)}</div>
                        </div>
                        <div className="border-t pt-2">
                          <Label htmlFor="subtotal_company">SUB TOTAL (Perusahaan)</Label>
                          <Input 
                            id="subtotal_company"
                            type="text" 
                            value={formatCurrency(form.subtotal_company)} 
                            readOnly
                            className="bg-white font-semibold text-green-600"
                          />
                        </div>
                      </div>
                      
                      {/* Total Pendapatan (Gaji + Tunjangan + BPJS Perusahaan) */}
                      <div>
                        <Label htmlFor="total_pendapatan_display">Total Pendapatan</Label>
                        <Input 
                          id="total_pendapatan_display"
                          type="text" 
                          value={formatCurrency(form.total_pendapatan)} 
                          readOnly
                          className="bg-white font-semibold text-green-600"
                        />
                      </div>
                      
                      {/* Deductions */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">POTONGAN</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>BPJS Kesehatan (Karyawan): {formatCurrency(form.bpjs_health_employee)}</div>
                          <div>BPJS Ketenagakerjaan JHT (Karyawan): {formatCurrency(form.jht_employee)}</div>
                          <div>BPJS Jaminan Pensiun (Karyawan): {formatCurrency(form.jp_employee)}</div>
                        </div>
                        <div className="border-t pt-2">
                          <Label htmlFor="subtotal_employee">SUB TOTAL (Potongan Karyawan)</Label>
                          <Input 
                            id="subtotal_employee"
                            type="text" 
                            value={formatCurrency(form.subtotal_employee)} 
                            readOnly
                            className="bg-white font-semibold text-red-600"
                          />
                        </div>
                      </div>
                      
                      {/* Manual Deductions */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="kasbon_display">KASBON</Label>
                          <Input 
                            id="kasbon_display"
                            type="text" 
                            value={formatCurrency(form.kasbon)} 
                            readOnly
                            className="bg-white font-semibold text-red-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telat_display">Telat</Label>
                          <Input 
                            id="telat_display"
                            type="text" 
                            value={formatCurrency(form.telat)} 
                            readOnly
                            className="bg-white font-semibold text-red-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="angsuran_kredit_display">Angsuran Kredit</Label>
                          <Input 
                            id="angsuran_kredit_display"
                            type="text" 
                            value={formatCurrency(form.angsuran_kredit)} 
                            readOnly
                            className="bg-white font-semibold text-red-600"
                          />
                        </div>
                      </div>
                      
                      {/* Final Totals */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <Label htmlFor="total_deductions">TOTAL PEMOTONGAN</Label>
                          <Input 
                            id="total_deductions"
                            type="text" 
                            value={formatCurrency(form.total_deductions)} 
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
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment_date">Tanggal Bayar</Label>
                        <Input 
                          id="payment_date"
                          type="date" 
                          value={form.payment_date || ''} 
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
                      <TableCell>{formatCurrency(Number(p.total_deductions))}</TableCell>
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