import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DollarSign, Plus, TrendingUp, Users, Eye, Edit, Check, Trash2, Search, Filter } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || "";

export const PayrollContent = () => {
  const { toast } = useToast();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollComponents, setPayrollComponents] = useState<any[]>([]);
  const [calculatedComponents, setCalculatedComponents] = useState<any[]>([]);
  const [breakdownPendapatan, setBreakdownPendapatan] = useState<any>({
    pendapatan_tetap: 0,      // Gaji Pokok
    pendapatan_tidak_tetap: 0, // Total Tunjangan
    total_pendapatan: 0        // Total keseluruhan
  });
  const [isCalculating, setIsCalculating] = useState(false); // Flag untuk mencegah multiple calls
  const isManualDeductionUpdate = useRef(false); // Flag untuk melacak update manual deduction

  // New state for table functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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
    bpjs_health_company: 0,      // BPJS Kesehatan (Perusahaan)
    jht_company: 0,              // BPJS Ketenagakerjaan JHT (Perusahaan)
    jkk_company: 0,              // BPJS Ketenagakerjaan JKK (Perusahaan)
    jkm_company: 0,              // BPJS Ketenagakerjaan JKM (Perusahaan)
    jp_company: 0,               // BPJS Jaminan Pensiun (Perusahaan)
    
    // Komponen Payroll yang Dihitung - Karyawan
    bpjs_health_employee: 0,     // BPJS Kesehatan (Karyawan)
    jht_employee: 0,             // BPJS Ketenagakerjaan JHT (Karyawan)
    jp_employee: 0,              // BPJS Jaminan Pensiun (Karyawan)
    
    // Pajak
    pph21: 0,
    
    // Deductions Manual
    kasbon: 0,
    telat: 0,
    angsuran_kredit: 0,
    
    // Total Deductions
    total_deductions: 0
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil data karyawan`);
      }
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/payroll-components`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil konfigurasi payroll`);
      }
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/salary`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal mengambil data salary`);
      }
      const data = await res.json();
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
  const calculatePayrollComponents = useCallback(async (basicSalary: number) => {
    // Prevent multiple simultaneous calls
    if (isCalculating) {
      return;
    }
    
    if (basicSalary <= 0) {
      setCalculatedComponents([]);
      return;
    }

    // Validasi employee_id harus terisi
    if (!form.employee_id) {
      return;
    }
    
    // Set flag to prevent multiple calls and recursive useEffect triggers
    setIsCalculating(true);
    
    try {
      const requestBody = {
        employee_id: form.employee_id,
        basic_salary: form.basic_salary, // Use basic salary from form (from salary data)
        manual_deductions: manualDeductions
      };
      
      const response = await fetch(`${API_URL}/api/payrolls/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404 && errorData.error?.includes('Data gaji karyawan tidak ditemukan')) {
          throw new Error('Data gaji karyawan tidak ditemukan. Silakan buat data salary terlebih dahulu.');
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}: Gagal menghitung komponen payroll`);
        }
      }

      const data = await response.json();
      
      setCalculatedComponents(data.calculated_components || []);
      
      // Update form dengan breakdown pendapatan dari backend
      if (data.totals) {
        setForm(prev => ({
          ...prev,
          // Backend mengirimkan breakdown pendapatan yang lengkap
          gross_salary: data.totals.total_pendapatan || prev.gross_salary,
          total_deductions: data.totals.total_deduction || 0,
          net_salary: data.totals.net_salary || prev.net_salary
        }));

        // Update breakdown pendapatan dari backend
        const newBreakdown = {
          pendapatan_tetap: data.totals.pendapatan_tetap || 0,           // Gaji Pokok
          pendapatan_tidak_tetap: data.totals.pendapatan_tidak_tetap || 0, // Total Tunjangan
          total_pendapatan: data.totals.total_pendapatan || 0             // Total keseluruhan
        };
        
        setBreakdownPendapatan(newBreakdown);
      }
      
      // Update komponen payroll yang dihitung
      if (data.calculated_components) {
        const components = data.calculated_components;
        setForm(prev => ({
          ...prev,
          // BPJS Kesehatan
          bpjs_health_employee: components.find(c => c.name === 'BPJS Kesehatan (Karyawan)')?.amount || 0,
          bpjs_health_company: components.find(c => c.name === 'BPJS Kesehatan (Perusahaan)')?.amount || 0,
          
          // BPJS Ketenagakerjaan
          jht_employee: components.find(c => c.name === 'BPJS Jaminan Hari Tua (Karyawan)')?.amount || 0,
          jht_company: components.find(c => c.name === 'BPJS Jaminan Hari Tua (Perusahaan)')?.amount || 0,
          
          // BPJS Jaminan Pensiun
          jp_employee: components.find(c => c.name === 'BPJS Jaminan Pensiun (Karyawan)')?.amount || 0,
          jp_company: components.find(c => c.name === 'BPJS Jaminan Pensiun (Perusahaan)')?.amount || 0,
          
          // BPJS Jaminan Kecelakaan Kerja & Kematian
          jkk_company: components.find(c => c.name === 'BPJS Jaminan Kecelakaan Kerja (Perusahaan)')?.amount || 0,
          jkm_company: components.find(c => c.name === 'BPJS Jaminan Kematian (Perusahaan)')?.amount || 0,
          
          // Pajak
          pph21: components.find(c => c.name === 'PPH21')?.amount || 0
        }));
      }
      
      // Toast success - hanya tampilkan jika bukan dari perubahan manual deduction
      if (!isManualDeductionUpdate.current) {
        toast({
          title: "Perhitungan Berhasil",
          description: "Komponen payroll berhasil dihitung oleh backend",
          variant: "default"
        });
      }
      
          } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghitung komponen payroll",
        variant: "destructive"
      });
      
      // Fallback to empty calculation (backend tidak tersedia)
      setCalculatedComponents([]);
    } finally {
      // Reset flag setelah selesai (success atau error)
      setIsCalculating(false);
    }
  }, [form.employee_id, manualDeductions, isCalculating]);



  // Recalculate when payrollComponents are loaded or employee changes
  useEffect(() => {
    // Only trigger calculation when employee changes or payroll components are loaded
    // Don't trigger on gross_salary changes to prevent infinite loop
    if (form.basic_salary > 0 && payrollComponents.length > 0 && form.employee_id && !isCalculating) {
      // Reset calculated components first to prevent accumulation
      setCalculatedComponents([]);
      // Use basic_salary (from salary data) instead of gross_salary to prevent loop
      calculatePayrollComponents(form.basic_salary);
    }
  }, [payrollComponents, form.employee_id, form.basic_salary, manualDeductions]); // Removed form.gross_salary to prevent infinite loop

  const handleFormChange = (field: string, value: any) => {
    if (field === 'employee_id') {
      // Reset semua state terlebih dahulu
      setCalculatedComponents([]);
      setBreakdownPendapatan({
        pendapatan_tetap: 0,
        pendapatan_tidak_tetap: 0,
        total_pendapatan: 0
      });
      setManualDeductions({
        kasbon: 0,
        telat: 0,
        angsuran_kredit: 0
      });
      setIsCalculating(false);
      
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
        const totalIncome = basicSalary + totalAllowances;
        
        // Update form dengan data salary dalam satu batch
        setForm(prev => ({
          ...prev,
          employee_id: value,
          basic_salary: basicSalary,
          position_allowance: posAllowance,
          management_allowance: mgmtAllowance,
          phone_allowance: phoneAllowance,
          incentive_allowance: incentiveAllowance,
          overtime_allowance: overtimeAllowance,
          total_allowances: totalAllowances,
          gross_salary: totalIncome
        }));
        
        // State akan ter-update dan useEffect akan otomatis memanggil calculatePayrollComponents
        // Tidak perlu manual call karena useEffect sudah handle ini
        
        // Toast success
        toast({
          title: "Data Salary Ditemukan",
          description: `Data salary untuk ${employees.find(emp => emp.id === value)?.first_name} ${employees.find(emp => emp.id === value)?.last_name} berhasil dimuat`,
          variant: "default"
        });
      } else {
        // Toast error jika karyawan belum ada data salary
        const selectedEmployee = employees.find(emp => emp.id === value);
        toast({
          title: "Data Salary Tidak Ditemukan",
          description: `Karyawan ${selectedEmployee?.first_name} ${selectedEmployee?.last_name} belum memiliki data salary. Silakan buat data salary terlebih dahulu.`,
          variant: "destructive"
        });
        
        // Reset form untuk karyawan tanpa data salary
        setForm(prev => ({
          ...prev,
          employee_id: value,
          basic_salary: 0,
          position_allowance: 0,
          management_allowance: 0,
          phone_allowance: 0,
          incentive_allowance: 0,
          overtime_allowance: 0,
          total_allowances: 0,
          gross_salary: 0
        }));
      }
    } else if (field === 'gross_salary') {
      // Hanya update form, useEffect akan handle perhitungan otomatis
      // Tidak perlu manual call calculatePayrollComponents
    } else {
      // Handle all other form fields (including date fields)
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleManualDeductionChange = (field: string, value: number) => {
    
    // Validasi: manual deduction tidak boleh melebihi total diterima
    const currentTotalManualDeductions = getTotalManualDeductions() - manualDeductions[field as keyof typeof manualDeductions] + value;
    
    if (currentTotalManualDeductions > form.net_salary) {
      toast({
        title: "Validasi Gagal",
        description: `Total potongan manual (${formatCurrency(currentTotalManualDeductions)}) tidak boleh melebihi total diterima (${formatCurrency(form.net_salary)})`,
        variant: "destructive"
      });
      return;
    }
    
    // Set flag untuk mencegah toast muncul
    isManualDeductionUpdate.current = true;
    
    const newManualDeductions = { ...manualDeductions, [field]: value };
    setManualDeductions(newManualDeductions);
    
    // Update form dengan manual deductions
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset flag setelah state update
    setTimeout(() => {
      isManualDeductionUpdate.current = false;
    }, 100);
    
    // Manual deductions berubah, useEffect akan handle perhitungan otomatis
    // Tidak perlu manual call calculatePayrollComponents
  };

  const handleAddPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Guard: Cegah duplikasi pada kombinasi employee + periode + payment_date
      const dup = payrolls.find(p => 
        p.employee_id === form.employee_id &&
        new Date(p.pay_period_start).toISOString().split('T')[0] === (form.pay_period_start || '') &&
        new Date(p.pay_period_end).toISOString().split('T')[0] === (form.pay_period_end || '') &&
        (p.payment_date ? new Date(p.payment_date).toISOString().split('T')[0] : '') === (form.payment_date || '')
      );
      if (dup) {
        setSubmitting(false);
        toast({
          title: 'Tidak dapat menambah',
          description: 'Payroll untuk karyawan dan periode yang sama dengan tanggal bayar yang sama sudah ada.',
          variant: 'destructive'
        });
        return;
      }

      // Siapkan data yang akan dikirim ke backend (sesuai schema database)
      const payrollData = {
        employee_id: form.employee_id,
        pay_period_start: form.pay_period_start,
        pay_period_end: form.pay_period_end,
        basic_salary: form.basic_salary,
        gross_salary: form.gross_salary,
        net_salary: form.net_salary,
        payment_date: form.payment_date,
        status: form.status,
        
        // Tunjangan dari Data Salary
        position_allowance: form.position_allowance,
        management_allowance: form.management_allowance,
        phone_allowance: form.phone_allowance,
        incentive_allowance: form.incentive_allowance,
        overtime_allowance: form.overtime_allowance,
        total_allowances: form.total_allowances,
        
        // Komponen Payroll yang Dihitung - Perusahaan
        bpjs_health_company: form.bpjs_health_company,
        jht_company: form.jht_company,
        jkk_company: form.jkk_company,
        jkm_company: form.jkm_company,
        jp_company: form.jp_company,
        
        // Komponen Payroll yang Dihitung - Karyawan
        bpjs_health_employee: form.bpjs_health_employee,
        jht_employee: form.jht_employee,
        jp_employee: form.jp_employee,
        
        // Pajak
        pph21: form.pph21,
        
        // Deductions Manual
        kasbon: form.kasbon,
        telat: form.telat,
        angsuran_kredit: form.angsuran_kredit,
        
        // Total Deductions
        total_deductions: form.total_deductions
      };

      const res = await fetch(`${API_URL}/api/payrolls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payrollData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Gagal tambah payroll`);
      }
      
      const result = await res.json();
      
      setModalOpen(false);
      setForm({ 
        employee_id: "", 
        pay_period_start: "", 
        pay_period_end: "", 
        basic_salary: 0,
        gross_salary: 0, 
        total_deductions: 0,
        net_salary: 0, 
        payment_date: "", 
        status: "PAID",
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
        
        // Komponen Payroll yang Dihitung - Karyawan
        bpjs_health_employee: 0,
        jht_employee: 0,
        jp_employee: 0,
        
        // Pajak
        pph21: 0,
        kasbon: 0,
        telat: 0,
        angsuran_kredit: 0
      });
      setCalculatedComponents([]);
      setManualDeductions({ kasbon: 0, telat: 0, angsuran_kredit: 0 });
      fetchPayrolls();
      toast({
        title: 'Berhasil',
        description: 'Payroll berhasil ditambahkan',
      });
    } catch (err: any) {
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

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getTotalManualDeductions = () => {
    return form.kasbon + form.telat + form.angsuran_kredit;
  };

  const setDefaultDates = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setForm(prev => ({
      ...prev,
      pay_period_start: firstDayOfMonth.toISOString().split('T')[0],
      pay_period_end: lastDayOfMonth.toISOString().split('T')[0],
      payment_date: today.toISOString().split('T')[0]
    }));
  };

  // Handler untuk View Payroll
  const handleViewPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    setViewModalOpen(true);
  };

  // Handler untuk Edit Payroll
  const handleEditPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    // Populate form dengan data payroll yang dipilih
    setForm({
      employee_id: payroll.employee_id,
      pay_period_start: new Date(payroll.pay_period_start).toISOString().split('T')[0],
      pay_period_end: new Date(payroll.pay_period_end).toISOString().split('T')[0],
      basic_salary: Number(payroll.basic_salary) || 0,
      gross_salary: Number(payroll.gross_salary) || 0,
      net_salary: Number(payroll.net_salary) || 0,
      payment_date: payroll.payment_date ? new Date(payroll.payment_date).toISOString().split('T')[0] : '',
      status: payroll.status || 'UNPAID',
      position_allowance: Number(payroll.position_allowance) || 0,
      management_allowance: Number(payroll.management_allowance) || 0,
      phone_allowance: Number(payroll.phone_allowance) || 0,
      incentive_allowance: Number(payroll.incentive_allowance) || 0,
      overtime_allowance: Number(payroll.overtime_allowance) || 0,
      total_allowances: Number(payroll.total_allowances) || 0,
      bpjs_health_company: Number(payroll.bpjs_health_company) || 0,
      jht_company: Number(payroll.jht_company) || 0,
      jkk_company: Number(payroll.jkk_company) || 0,
      jkm_company: Number(payroll.jkm_company) || 0,
      jp_company: Number(payroll.jp_company) || 0,
      bpjs_health_employee: Number(payroll.bpjs_health_employee) || 0,
      jht_employee: Number(payroll.jht_employee) || 0,
      jp_employee: Number(payroll.jp_employee) || 0,
      // pph21 dihapus dari schema, jangan dipakai
      pph21: 0,
      kasbon: Number(payroll.kasbon) || 0,
      telat: Number(payroll.telat) || 0,
      angsuran_kredit: Number(payroll.angsuran_kredit) || 0,
      total_deductions: Number(payroll.total_deductions) || 0
    });
    setEditModalOpen(true);
  };

  // Handler untuk Submit Edit Payroll
  const handleEditPayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayroll) return;

    try {
      // Hitung ulang seperti Tambah Payroll
      const totalAllowances = (form.position_allowance || 0) + (form.management_allowance || 0) + (form.phone_allowance || 0) + (form.incentive_allowance || 0) + (form.overtime_allowance || 0);

      const bpjsHealthCompany = calculatedComponents.find(c => c.name === 'BPJS Kesehatan (Perusahaan)' && c.type === 'income')?.amount || form.bpjs_health_company || 0;
      const jhtCompany = calculatedComponents.find(c => c.name === 'BPJS Jaminan Hari Tua (Perusahaan)' && c.type === 'income')?.amount || form.jht_company || 0;
      const jkkCompany = calculatedComponents.find(c => c.name === 'BPJS Jaminan Kecelakaan Kerja (Perusahaan)' && c.type === 'income')?.amount || form.jkk_company || 0;
      const jkmCompany = calculatedComponents.find(c => c.name === 'BPJS Jaminan Kematian (Perusahaan)' && c.type === 'income')?.amount || form.jkm_company || 0;
      const jpCompany = calculatedComponents.find(c => c.name === 'BPJS Jaminan Pensiun (Perusahaan)' && c.type === 'income')?.amount || form.jp_company || 0;

      const bpjsHealthEmployee = calculatedComponents.find(c => c.name === 'BPJS Kesehatan (Karyawan)' && c.type === 'deduction')?.amount || form.bpjs_health_employee || 0;
      const jhtEmployee = calculatedComponents.find(c => c.name === 'BPJS Jaminan Hari Tua (Karyawan)' && c.type === 'deduction')?.amount || form.jht_employee || 0;
      const jpEmployee = calculatedComponents.find(c => c.name === 'BPJS Jaminan Pensiun (Karyawan)' && c.type === 'deduction')?.amount || form.jp_employee || 0;

      const subtotalCompany = bpjsHealthCompany + jhtCompany + jkkCompany + jkmCompany + jpCompany;
      const subtotalEmployee = bpjsHealthEmployee + jhtEmployee + jpEmployee;

      const totalManualDeduction = (form.kasbon || 0) + (form.telat || 0) + (form.angsuran_kredit || 0);
      const totalDeduction = subtotalEmployee + totalManualDeduction;

      const grossSalary = (form.basic_salary || 0) + totalAllowances;
      const totalPendapatan = (form.basic_salary || 0) + totalAllowances + subtotalCompany;
      const netSalary = totalPendapatan - totalDeduction;

      const payload = {
        employee_id: form.employee_id,
        pay_period_start: form.pay_period_start,
        pay_period_end: form.pay_period_end,
        basic_salary: form.basic_salary,
        gross_salary: grossSalary,
        net_salary: netSalary,
        payment_date: form.payment_date,
        status: form.status,

        // Tunjangan
        position_allowance: form.position_allowance,
        management_allowance: form.management_allowance,
        phone_allowance: form.phone_allowance,
        incentive_allowance: form.incentive_allowance,
        overtime_allowance: form.overtime_allowance,
        total_allowances: totalAllowances,

        // Komponen perusahaan
        bpjs_health_company: bpjsHealthCompany,
        jht_company: jhtCompany,
        jkk_company: jkkCompany,
        jkm_company: jkmCompany,
        jp_company: jpCompany,
        subtotal_company: subtotalCompany,

        // Komponen karyawan
        bpjs_health_employee: bpjsHealthEmployee,
        jht_employee: jhtEmployee,
        jp_employee: jpEmployee,
        subtotal_employee: subtotalEmployee,

        // Manual deductions
        kasbon: form.kasbon,
        telat: form.telat,
        angsuran_kredit: form.angsuran_kredit,

        // Totals
        total_deductions: totalDeduction,
        total_pendapatan: totalPendapatan,

        // Legacy/Additional
        bpjs_employee: subtotalEmployee,
        bpjs_company: subtotalCompany,
        jkk: jkkCompany,
        jkm: jkmCompany,
        deductions: totalDeduction
      };

      const response = await fetch(`${API_URL}/api/payrolls/${selectedPayroll.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Gagal mengupdate payroll');
      }

      toast({
        title: "Berhasil",
        description: "Payroll berhasil diupdate",
        variant: "default"
      });

      setEditModalOpen(false);
      setSelectedPayroll(null);
      fetchPayrolls();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal mengupdate payroll', variant: 'destructive' });
    }
  };

  // Handler untuk Mark as Paid
  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payrolls/${payrollId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' })
      });

      if (!response.ok) {
        throw new Error('Gagal mengubah status payroll');
      }

      toast({
        title: "Berhasil",
        description: "Status payroll berhasil diubah menjadi PAID",
        variant: "default"
      });

      // Refresh data
      fetchPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengubah status payroll",
        variant: "destructive"
      });
    }
  };

  // Handler untuk Delete Payroll
  const handleDeletePayroll = async (payrollId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus payroll ini?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payrolls/${payrollId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus payroll');
      }

      toast({
        title: "Berhasil",
        description: "Payroll berhasil dihapus",
        variant: "default"
      });

      // Refresh data
      fetchPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus payroll",
        variant: "destructive"
      });
    }
  };

  // Filter and search functions
  const filteredPayrolls = payrolls.filter((payroll) => {
    // Search filter
    const searchMatch = searchTerm === "" || 
      payroll.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee?.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const statusMatch = statusFilter === "all" || payroll.status === statusFilter;

    // Date filter
    let dateMatch = true;
    if (dateFilter !== "all") {
      const today = new Date();
      const payrollDate = new Date(payroll.pay_period_start);
      
      switch (dateFilter) {
        case "today":
          dateMatch = payrollDate.toDateString() === today.toDateString();
          break;
        case "thisWeek":
          const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
          const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          dateMatch = payrollDate >= weekStart && payrollDate <= weekEnd;
          break;
        case "thisMonth":
          dateMatch = payrollDate.getMonth() === today.getMonth() && 
                     payrollDate.getFullYear() === today.getFullYear();
          break;
        case "thisYear":
          dateMatch = payrollDate.getFullYear() === today.getFullYear();
          break;
      }
    }

    return searchMatch && statusMatch && dateMatch;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
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
          <Dialog open={modalOpen} onOpenChange={(open) => {
            setModalOpen(open);
            if (open) {
              setDefaultDates();
            } else {
              // Reset form ketika modal ditutup ESC/close
              setForm({
                employee_id: "",
                pay_period_start: "",
                pay_period_end: "",
                basic_salary: 0,
                gross_salary: 0,
                net_salary: 0,
                payment_date: "",
                status: "PAID",
                position_allowance: 0,
                management_allowance: 0,
                phone_allowance: 0,
                incentive_allowance: 0,
                overtime_allowance: 0,
                total_allowances: 0,
                bpjs_health_company: 0,
                jht_company: 0,
                jkk_company: 0,
                jkm_company: 0,
                jp_company: 0,
                bpjs_health_employee: 0,
                jht_employee: 0,
                jp_employee: 0,
                pph21: 0,
                kasbon: 0,
                telat: 0,
                angsuran_kredit: 0,
                total_deductions: 0
              });
              setCalculatedComponents([]);
              setManualDeductions({ kasbon: 0, telat: 0, angsuran_kredit: 0 });
            }
          }}>
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
                      value={formatDateForInput(form.pay_period_start)} 
                      onChange={(e) => handleFormChange('pay_period_start', e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="pay_period_end">Periode Akhir</Label>
                    <Input 
                      id="pay_period_end"
                      type="date" 
                      value={formatDateForInput(form.pay_period_end)} 
                      onChange={(e) => handleFormChange('pay_period_end', e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                
                {/* Gaji Pokok - Auto-filled from salary data */}
                <div>
                  <Label htmlFor="basic_salary">Gaji Pokok</Label>
                  <Input 
                    id="basic_salary"
                    type="number" 
                    value={form.basic_salary} 
                    onChange={(e) => handleFormChange('basic_salary', Number(e.target.value))} 
                    required 
                    placeholder="Otomatis terisi dari data salary"
                    className="bg-gray-50"
                    readOnly={form.employee_id !== ""}
                  />
                  {form.employee_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Gaji pokok karyawan (diambil dari data salary)
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
                                 <div className="text-xs text-gray-600 mt-1">
                                   {component.percentage}% dari gaji pokok murni
                                 </div>
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
                                  <div className="text-xs text-gray-600 mt-1">
                                    {component.percentage}% dari gaji pokok murni
                                  </div>
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
                                  <div className="text-xs text-gray-600 mt-1">
                                    {component.percentage}% dari gaji pokok murni
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(component.amount)}
                                </span>
                              </div>
                            ))}
                            
                            {/* Manual Deductions */}
                            {form.kasbon > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">KASBON</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(form.kasbon)}
                                </span>
                              </div>
                            )}
                            {form.angsuran_kredit > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">Angsuran Kredit</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(form.angsuran_kredit)}
                                </span>
                              </div>
                            )}
                            {form.telat > 0 && (
                              <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                                <span className="font-medium text-sm text-gray-800">Telat</span>
                                <span className="text-sm font-bold text-red-700 ml-4">
                                  {formatCurrency(form.telat)}
                                </span>
                           </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 bg-red-100 rounded-lg border border-red-300">
                            <span className="font-semibold text-gray-800">SUB TOTAL</span>
                            <span className="font-bold text-red-800">
                              {formatCurrency(calculatedComponents.filter(c => c.type === 'deduction' && c.name.includes('(Karyawan)')).reduce((sum, c) => sum + c.amount, 0) + 
                                form.kasbon + form.telat + form.angsuran_kredit)}
                            </span>
                          </div>
                        </div>
                       
                                               {/* TOTAL PEMOTONGAN */}
                        <div className="flex justify-between items-center py-4 px-5 bg-red-200 rounded-lg border-2 border-red-400">
                          <span className="text-xl font-bold text-gray-800">TOTAL PEMOTONGAN</span>
                          <span className="text-2xl font-bold text-red-800">
                            {formatCurrency(form.total_deductions)}
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
                                        <div className="text-xs text-gray-600 mt-1">
                                          {component.percentage}% dari gaji pokok murni
                                        </div>
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
                            value={form.kasbon} 
                            onChange={(e) => handleManualDeductionChange('kasbon', Number(e.target.value))} 
                            placeholder="0"
                            min="0"
                            className={form.kasbon > 0 && getTotalManualDeductions() > form.net_salary ? 'border-red-500' : ''}
                          />
                                                <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(form.kasbon)}
                          </div>
                          {form.kasbon > 0 && getTotalManualDeductions() > form.net_salary && (
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
                            value={form.telat} 
                            onChange={(e) => handleManualDeductionChange('telat', Number(e.target.value))} 
                            placeholder="0"
                            min="0"
                            className={form.telat > 0 && getTotalManualDeductions() > form.net_salary ? 'border-red-500' : ''}
                          />
                                                <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(form.telat)}
                          </div>
                          {form.telat > 0 && getTotalManualDeductions() > form.net_salary && (
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
                            value={form.angsuran_kredit} 
                            onChange={(e) => handleManualDeductionChange('angsuran_kredit', Number(e.target.value))} 
                            placeholder="0"
                            min="0"
                            className={form.angsuran_kredit > 0 && getTotalManualDeductions() > form.net_salary ? 'border-red-500' : ''}
                          />
                                                <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(form.angsuran_kredit)}
                          </div>
                          {form.angsuran_kredit > 0 && getTotalManualDeductions() > form.net_salary && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ Melebihi batas maksimal
                            </div>
                          )}
                    </div>
                  </div>
                  
                  {/* Warning message for total deductions */}
                  {getTotalManualDeductions() > form.net_salary && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center text-red-700">
                        <span className="text-sm font-medium">
                          ⚠️ Total potongan manual ({formatCurrency(getTotalManualDeductions())}) melebihi total diterima ({formatCurrency(form.net_salary)})
                        </span>
                      </div>
                    </div>
                  )}

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
                      <Label htmlFor="total_deductions">Total Potongan</Label>
                      <Input 
                        id="total_deductions"
                        type="text" 
                        value={formatCurrency(form.total_deductions)} 
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
                      value={formatDateForInput(form.payment_date)} 
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

      {/* View Payroll Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Payroll</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Informasi Karyawan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Nama:</span>
                    <p className="text-gray-700">{selectedPayroll.employee?.first_name} {selectedPayroll.employee?.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Jabatan:</span>
                    <p className="text-gray-700">{selectedPayroll.employee?.position}</p>
                  </div>
                  <div>
                    <span className="font-medium">Periode:</span>
                    <p className="text-gray-700">
                      {new Date(selectedPayroll.pay_period_start).toLocaleDateString('id-ID')} - {new Date(selectedPayroll.pay_period_end).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      selectedPayroll.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                      selectedPayroll.status === 'UNPAID' ? 'bg-red-100 text-red-700' :
                      selectedPayroll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedPayroll.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* PENDAPATAN Section */}
              <div className="space-y-4">
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-800">PENDAPATAN</h3>
                </div>
                
                {/* PENDAPATAN TETAP */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TETAP</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="font-medium text-sm text-gray-800">Gaji Pokok</span>
                      <span className="text-sm font-bold text-green-700 ml-4">
                        {formatCurrency(selectedPayroll.basic_salary || 0)}
                      </span>
                    </div>
                    
                    {/* BPJS Company Contributions */}
                    {Number(selectedPayroll?.bpjs_health_company ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-sm text-gray-800">BPJS Kesehatan (Perusahaan)</span>
                          <span className="text-xs text-gray-500 block">
                            {((Number(selectedPayroll?.bpjs_health_company ?? 0) / Number(selectedPayroll?.basic_salary ?? 1)) * 100).toFixed(1)}% dari gaji pokok
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 ml-4">
                          {formatCurrency(Number(selectedPayroll?.bpjs_health_company ?? 0))}
                        </span>
                      </div>
                    )}
                    
                    {Number(selectedPayroll?.jht_company ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-sm text-gray-800">BPJS Ketenagakerjaan JHT (Perusahaan)</span>
                          <span className="text-xs text-gray-500 block">
                            {((Number(selectedPayroll?.jht_company ?? 0) / Number(selectedPayroll?.basic_salary ?? 1)) * 100).toFixed(1)}% dari gaji pokok
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 ml-4">
                          {formatCurrency(Number(selectedPayroll?.jht_company ?? 0))}
                        </span>
                      </div>
                    )}
                    
                    {Number(selectedPayroll?.jkm_company ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-sm text-gray-800">BPJS Ketenagakerjaan JKM (Perusahaan)</span>
                          <span className="text-xs text-gray-500 block">
                            {((Number(selectedPayroll?.jkm_company ?? 0) / Number(selectedPayroll?.basic_salary ?? 1)) * 100).toFixed(1)}% dari gaji pokok
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 ml-4">
                          {formatCurrency(Number(selectedPayroll?.jkm_company ?? 0))}
                        </span>
                      </div>
                    )}
                    
                    {Number(selectedPayroll?.jkk_company ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-sm text-gray-800">BPJS Ketenagakerjaan JKK (Perusahaan)</span>
                          <span className="text-xs text-gray-500 block">
                            {((Number(selectedPayroll?.jkk_company ?? 0) / Number(selectedPayroll?.basic_salary ?? 1)) * 100).toFixed(1)}% dari gaji pokok
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 ml-4">
                          {formatCurrency(Number(selectedPayroll?.jkk_company ?? 0))}
                        </span>
                      </div>
                    )}
                    
                    {Number(selectedPayroll?.jp_company ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-sm text-gray-800">BPJS Jaminan Pensiun (Perusahaan)</span>
                          <span className="text-xs text-gray-500 block">
                            {((Number(selectedPayroll?.jp_company ?? 0) / Number(selectedPayroll?.basic_salary ?? 1)) * 100).toFixed(1)}% dari gaji pokok
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 ml-4">
                          {formatCurrency(Number(selectedPayroll?.jp_company ?? 0))}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-green-100 rounded-lg border border-green-300">
                    <span className="font-semibold text-gray-800">SUB TOTAL</span>
                    <span className="font-bold text-green-800">
                      {formatCurrency(Number(selectedPayroll?.subtotal_company ?? 0) || (Number(selectedPayroll?.basic_salary ?? 0) + Number(selectedPayroll?.bpjs_health_company ?? 0) + Number(selectedPayroll?.jht_company ?? 0) + Number(selectedPayroll?.jkm_company ?? 0) + Number(selectedPayroll?.jkk_company ?? 0) + Number(selectedPayroll?.jp_company ?? 0)))}
                    </span>
                  </div>
                </div>
                
                {/* PENDAPATAN TIDAK TETAP */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TIDAK TETAP</h4>
                  <div className="space-y-2">
                    {selectedPayroll.position_allowance > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Jabatan</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(selectedPayroll.position_allowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.management_allowance > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Pengurus</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(selectedPayroll.management_allowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.phone_allowance > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Pulsa</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(selectedPayroll.phone_allowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.incentive_allowance > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Insentif</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(selectedPayroll.incentive_allowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.overtime_allowance > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Lembur</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {formatCurrency(selectedPayroll.overtime_allowance)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg border border-blue-300">
                    <span className="font-semibold text-gray-800">SUB TOTAL</span>
                    <span className="font-bold text-blue-800">
                      {formatCurrency(selectedPayroll.total_allowances || 0)}
                    </span>
                  </div>
                </div>
                
                {/* TOTAL PENDAPATAN */}
                <div className="flex justify-between items-center py-4 px-5 bg-green-200 rounded-lg border-2 border-green-400">
                  <span className="text-xl font-bold text-gray-800">TOTAL PENDAPATAN</span>
                  <span className="text-2xl font-bold text-green-800">
                    {formatCurrency(Number(selectedPayroll?.total_pendapatan ?? 0) || Number(selectedPayroll?.gross_salary ?? 0))}
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
                    {selectedPayroll.bpjs_health_company > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Kesehatan (Perusahaan)</span>
                        <span className="text-sm font-bold text-orange-700 ml-4">
                          {formatCurrency(selectedPayroll.bpjs_health_company)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jht_company > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Hari Tua (Perusahaan)</span>
                        <span className="text-sm font-bold text-orange-700 ml-4">
                          {formatCurrency(selectedPayroll.jht_company)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jkk_company > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Kecelakaan Kerja (Perusahaan)</span>
                        <span className="text-sm font-bold text-orange-700 ml-4">
                          {formatCurrency(selectedPayroll.jkk_company)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jkm_company > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Kematian (Perusahaan)</span>
                        <span className="text-sm font-bold text-orange-700 ml-4">
                          {formatCurrency(selectedPayroll.jkm_company)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jp_company > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Pensiun (Perusahaan)</span>
                        <span className="text-sm font-bold text-orange-700 ml-4">
                          {formatCurrency(selectedPayroll.jp_company)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-orange-100 rounded-lg border border-orange-300">
                    <span className="font-semibold text-gray-800">SUB TOTAL</span>
                    <span className="font-bold text-orange-800">
                      {formatCurrency(Number(selectedPayroll.subtotal_company ?? 0))}
                    </span>
                  </div>
                </div>
                
                {/* KARYAWAN */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">KARYAWAN</h4>
                  <div className="space-y-2">
                    {selectedPayroll.bpjs_health_employee > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Kesehatan (Karyawan)</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.bpjs_health_employee)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jht_employee > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Hari Tua (Karyawan)</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.jht_employee)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.jp_employee > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">BPJS Jaminan Pensiun (Karyawan)</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.jp_employee)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.pph21 > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">PPH21</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.pph21)}
                        </span>
                      </div>
                    )}
                    
                    {/* Manual Deductions */}
                    {selectedPayroll.kasbon > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">KASBON</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.kasbon)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.telat > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">Telat</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.telat)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.angsuran_kredit > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="font-medium text-sm text-gray-800">Angsuran Kredit</span>
                        <span className="text-sm font-bold text-red-700 ml-4">
                          {formatCurrency(selectedPayroll.angsuran_kredit)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-red-100 rounded-lg border border-red-300">
                    <span className="font-semibold text-gray-800">SUB TOTAL</span>
                    <span className="font-bold text-red-800">
                      {formatCurrency(Number(selectedPayroll.subtotal_employee ?? 0))}
                    </span>
                  </div>
                </div>
                
                {/* TOTAL PEMOTONGAN */}
                <div className="flex justify-between items-center py-4 px-5 bg-red-200 rounded-lg border-2 border-red-400">
                  <span className="text-xl font-bold text-gray-800">TOTAL PEMOTONGAN</span>
                  <span className="text-2xl font-bold text-red-800">
                    {formatCurrency(selectedPayroll.total_deductions || 0)}
                  </span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPayroll.gross_salary || 0)}</p>
                  <p className="text-xs text-gray-500">Gaji + Tunjangan</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Potongan</span>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(selectedPayroll.total_deductions || 0)}</p>
                  <p className="text-xs text-gray-500">BPJS + PPH21 + Manual</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Diterima</span>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedPayroll.net_salary || 0)}</p>
                  <p className="text-xs text-gray-500">Pendapatan - Potongan</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                  Tutup
                </Button>
                {(selectedPayroll.status === 'UNPAID' || selectedPayroll.status === 'PENDING') && (
                  <Button onClick={() => {
                    setViewModalOpen(false);
                    handleEditPayroll(selectedPayroll);
                  }}>
                    Edit Payroll
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPayrollSubmit} className="space-y-6">
            {/* Form fields sama seperti form tambah, tapi dengan data yang sudah terisi */}
            {/* Employee Selection */}
            <div>
              <Label htmlFor="edit_employee_id">Karyawan</Label>
              <Input 
                id="edit_employee_id"
                value={employees.find(emp => emp.id === form.employee_id)?.first_name + ' ' + employees.find(emp => emp.id === form.employee_id)?.last_name || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_pay_period_start">Periode Mulai</Label>
                <Input 
                  id="edit_pay_period_start"
                  type="date" 
                  value={form.pay_period_start} 
                  onChange={(e) => handleFormChange('pay_period_start', e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit_pay_period_end">Periode Akhir</Label>
                <Input 
                  id="edit_pay_period_end"
                  type="date" 
                  value={form.pay_period_end} 
                  onChange={(e) => handleFormChange('pay_period_end', e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Basic Salary */}
            <div>
              <Label htmlFor="edit_basic_salary">Gaji Pokok</Label>
              <Input 
                id="edit_basic_salary"
                type="number" 
                value={form.basic_salary} 
                onChange={(e) => handleFormChange('basic_salary', Number(e.target.value))} 
                required 
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Nilai ini diambil dari data salary dan tidak dapat diubah di sini.</p>
            </div>

            {/* Manual Deductions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Potongan Manual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_kasbon">KASBON</Label>
                  <Input 
                    id="edit_kasbon"
                    type="number" 
                    value={form.kasbon} 
                    onChange={(e) => handleManualDeductionChange('kasbon', Number(e.target.value))} 
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_telat">Telat</Label>
                  <Input 
                    id="edit_telat"
                    type="number" 
                    value={form.telat} 
                    onChange={(e) => handleManualDeductionChange('telat', Number(e.target.value))} 
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_angsuran_kredit">Angsuran Kredit</Label>
                  <Input 
                    id="edit_angsuran_kredit"
                    type="number" 
                    value={form.angsuran_kredit} 
                    onChange={(e) => handleManualDeductionChange('angsuran_kredit', Number(e.target.value))} 
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Hasil Perhitungan (sama seperti Tambah Payroll) */}
            {calculatedComponents.length > 0 && (
              <div className="space-y-6">
                {/* PENDAPATAN */}
                <div className="space-y-4">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-800">PENDAPATAN</h3>
                  </div>

                  {/* PENDAPATAN TETAP (BPJS Perusahaan) */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TETAP</h4>
                    <div className="space-y-2">
                      {calculatedComponents.filter(c => c.type === 'income').map((component, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-800">{component.name}</span>
                            <div className="text-xs text-gray-600 mt-1">
                              {component.percentage}% dari gaji pokok murni
                            </div>
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

                  {/* PENDAPATAN TIDAK TETAP (Tunjangan dari form) */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PENDAPATAN TIDAK TETAP</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Jabatan</span>
                        <span className="text-sm font-semibold text-blue-700">{formatCurrency(form.position_allowance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Pengurus</span>
                        <span className="text-sm font-semibold text-blue-700">{formatCurrency(form.management_allowance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Pulsa</span>
                        <span className="text-sm font-semibold text-blue-700">{formatCurrency(form.phone_allowance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Insentif</span>
                        <span className="text-sm font-semibold text-blue-700">{formatCurrency(form.incentive_allowance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="font-medium text-sm text-gray-800">Tunjangan Lembur</span>
                        <span className="text-sm font-semibold text-blue-700">{formatCurrency(form.overtime_allowance || 0)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg border border-blue-300">
                      <span className="font-semibold text-gray-800">SUB TOTAL</span>
                      <span className="font-bold text-blue-800">
                        {formatCurrency((form.position_allowance || 0) + (form.management_allowance || 0) + (form.phone_allowance || 0) + (form.incentive_allowance || 0) + (form.overtime_allowance || 0))}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL PENDAPATAN (Gaji + Tunjangan) */}
                  <div className="flex justify-between items-center py-4 px-5 bg-green-200 rounded-lg border-2 border-green-400">
                    <span className="text-xl font-bold text-gray-800">TOTAL PENDAPATAN</span>
                    <span className="text-2xl font-bold text-green-800">
                      {formatCurrency((form.basic_salary || 0) + ((form.position_allowance || 0) + (form.management_allowance || 0) + (form.phone_allowance || 0) + (form.incentive_allowance || 0) + (form.overtime_allowance || 0)))}
                    </span>
                  </div>
                </div>

                {/* PEMOTONGAN */}
                <div className="space-y-4">
                  <div className="bg-gray-100 px-4 py-3 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-800">PEMOTONGAN</h3>
                  </div>

                  {/* PERUSAHAAN */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">PERUSAHAAN</h4>
                    <div className="space-y-2">
                      {calculatedComponents.filter(c => c.type === 'income' && c.category === 'bpjs').map((component, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-800">{component.name}</span>
                            <div className="text-xs text-gray-600 mt-1">
                              {component.percentage}% dari gaji pokok murni
                            </div>
                          </div>
                          <span className="text-sm font-bold text-orange-700 ml-4">{formatCurrency(component.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-orange-100 rounded-lg border border-orange-300">
                      <span className="font-semibold text-gray-800">SUB TOTAL</span>
                      <span className="font-bold text-orange-800">
                        {formatCurrency(calculatedComponents.filter(c => c.type === 'income' && c.category === 'bpjs').reduce((s, c) => s + c.amount, 0))}
                      </span>
                    </div>
                  </div>

                  {/* KARYAWAN */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">KARYAWAN</h4>
                    <div className="space-y-2">
                      {calculatedComponents.filter(c => c.type === 'deduction' && c.category === 'bpjs').map((component, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-800">{component.name}</span>
                            <div className="text-xs text-gray-600 mt-1">
                              {component.percentage}% dari gaji pokok murni
                            </div>
                          </div>
                          <span className="text-sm font-bold text-red-700 ml-4">{formatCurrency(component.amount)}</span>
                        </div>
                      ))}
                      {/* Manual Deductions */}
                      {(form.kasbon || 0) > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-sm text-gray-800">KASBON</span>
                          <span className="text-sm font-bold text-red-700 ml-4">{formatCurrency(form.kasbon || 0)}</span>
                        </div>
                      )}
                      {(form.telat || 0) > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-sm text-gray-800">Telat</span>
                          <span className="text-sm font-bold text-red-700 ml-4">{formatCurrency(form.telat || 0)}</span>
                        </div>
                      )}
                      {(form.angsuran_kredit || 0) > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-sm text-gray-800">Angsuran Kredit</span>
                          <span className="text-sm font-bold text-red-700 ml-4">{formatCurrency(form.angsuran_kredit || 0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-red-100 rounded-lg border border-red-300">
                      <span className="font-semibold text-gray-800">SUB TOTAL</span>
                      <span className="font-bold text-red-800">
                        {formatCurrency(
                          calculatedComponents.filter(c => c.type === 'deduction' && c.category === 'bpjs').reduce((s, c) => s + c.amount, 0) +
                          (form.kasbon || 0) + (form.telat || 0) + (form.angsuran_kredit || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL PEMOTONGAN */}
                  <div className="flex justify-between items-center py-4 px-5 bg-red-200 rounded-lg border-2 border-red-400">
                    <span className="text-xl font-bold text-gray-800">TOTAL PEMOTONGAN</span>
                    <span className="text-2xl font-bold text-red-800">
                      {formatCurrency(form.total_deductions || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Label>Total Pendapatan</Label>
                <Input 
                  type="text" 
                  value={formatCurrency(form.gross_salary)} 
                  readOnly
                  className="bg-white font-semibold"
                />
              </div>
              <div>
                <Label>Total Potongan</Label>
                <Input 
                  type="text" 
                  value={formatCurrency(form.total_deductions)} 
                  readOnly
                  className="bg-white font-semibold text-red-600"
                />
              </div>
              <div>
                <Label>Total Diterima</Label>
                <Input 
                  type="text" 
                  value={formatCurrency(form.net_salary)} 
                  readOnly
                  className="bg-white font-semibold text-green-600"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                Update Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Payroll</CardTitle>
              <CardDescription>Semua data payroll dengan fitur filter dan pencarian</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {filteredPayrolls.length} dari {payrolls.length} payroll
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, posisi, atau ID payroll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="APPROVED">APPROVED</SelectItem>
                <SelectItem value="PAID">PAID</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
                <SelectItem value="UNPAID">UNPAID</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Tanggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tanggal</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                <SelectItem value="thisYear">Tahun Ini</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Clear Filters */}
            {(searchTerm !== "" || statusFilter !== "all" || dateFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {payrolls.length === 0 ? "Belum ada data payroll" : "Tidak ada payroll yang sesuai dengan filter"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Total Pendapatan</TableHead>
                    <TableHead>Total Deductions</TableHead>
                    <TableHead>Gaji Bersih</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payroll.employee?.first_name} {payroll.employee?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payroll.employee?.position}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(payroll.pay_period_start).toLocaleDateString('id-ID')}</div>
                          <div className="text-muted-foreground">
                            {new Date(payroll.pay_period_end).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payroll.basic_salary)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payroll.gross_salary)}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(payroll.total_deductions)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(payroll.net_salary)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payroll.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                          payroll.status === 'UNPAID' ? 'bg-red-100 text-red-800' :
                          payroll.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payroll.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          payroll.status === 'REJECTED' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payroll.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPayroll(payroll)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Edit Button - hanya jika status UNPAID atau PENDING */}
                          {(payroll.status === 'UNPAID' || payroll.status === 'PENDING') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPayroll(payroll)}
                              className="h-8 w-8 p-0"
                              title="Edit Payroll"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* PAID Button - hanya jika status UNPAID atau PENDING */}
                          {(payroll.status === 'UNPAID' || payroll.status === 'PENDING') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkAsPaid(payroll.id)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                              title="Mark as Paid"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Delete Button - hanya jika status UNPAID */}
                          {payroll.status === 'UNPAID' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePayroll(payroll.id)}
                              className="h-8 w-8 p-0"
                              title="Delete Payroll"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollContent;

