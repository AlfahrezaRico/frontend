import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Plus, Upload, Edit, Trash2, DollarSign, Users, TrendingUp, Eye, Building2, Calendar } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SalaryRecord {
  id: string;
  employee_id: string;
  nik: string;
  basic_salary: number | string;
  position_allowance?: number | string | null;
  management_allowance?: number | string | null;
  phone_allowance?: number | string | null;
  incentive_allowance?: number | string | null;
  overtime_allowance?: number | string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    departemen?: {
      nama: string;
    };
  };
}

interface Employee {
  id: string;
  nik: string;
  first_name: string;
  last_name: string;
  departemen?: {
    nama: string;
  };
}

export const SalaryContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salaryData, setSalaryData] = useState<SalaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);

  const parsedHeaders = useMemo(() => {
    if (csvRows.length > 0) return Object.keys(csvRows[0] || {});
    if (csvData.trim()) {
      const first = csvData.trim().split('\n')[0] || '';
      return first.split(',').map((h) => h.trim());
    }
    return [] as string[];
  }, [csvRows, csvData]);

  const requiredHeaders = ['nik', 'basic_salary'];
  const optionalHeaders = ['position_allowance','management_allowance','phone_allowance','incentive_allowance','overtime_allowance'];
  const lowerHeaders = parsedHeaders.map((h) => h.toLowerCase());
  const missingRequired = requiredHeaders.filter((h) => !lowerHeaders.includes(h));

  const handleDownloadTemplate = () => {
    const headers = ['nik','basic_salary','position_allowance','management_allowance','phone_allowance','incentive_allowance','overtime_allowance'];
    const example = ['EMP001','5000000','500000','300000','100000','200000','150000'];
    const csv = `${headers.join(',')}\n${example.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-upload-salary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const API_URL = import.meta.env.VITE_API_URL || '';

  // Form state for add/edit
  const [formData, setFormData] = useState({
    employee_id: '',
    nik: '',
    basic_salary: '',
    position_allowance: '',
    management_allowance: '',
    phone_allowance: '',
    incentive_allowance: '',
    overtime_allowance: ''
  });

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/salary`);
      if (response.ok) {
        const data = await response.json();
        setSalaryData(data);
      }
    } catch (error) {
      console.error('Error fetching salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchSalaryData();
    fetchEmployees();
  }, []);

  const filteredData = salaryData.filter(item =>
    `${item.employee?.first_name} ${item.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee?.departemen?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSalary = salaryData.reduce((sum, item) => sum + (typeof item.basic_salary === 'string' ? parseFloat(item.basic_salary) || 0 : item.basic_salary || 0), 0);
  const totalAllowances = salaryData.reduce((sum, item) => {
    const posAllowance = typeof item.position_allowance === 'string' ? parseFloat(item.position_allowance) || 0 : item.position_allowance || 0;
    const mgmtAllowance = typeof item.management_allowance === 'string' ? parseFloat(item.management_allowance) || 0 : item.management_allowance || 0;
    const phoneAllowance = typeof item.phone_allowance === 'string' ? parseFloat(item.phone_allowance) || 0 : item.phone_allowance || 0;
    const incentiveAllowance = typeof item.incentive_allowance === 'string' ? parseFloat(item.incentive_allowance) || 0 : item.incentive_allowance || 0;
    const overtimeAllowance = typeof item.overtime_allowance === 'string' ? parseFloat(item.overtime_allowance) || 0 : item.overtime_allowance || 0;
    return sum + posAllowance + mgmtAllowance + phoneAllowance + incentiveAllowance + overtimeAllowance;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      nik: '',
      basic_salary: '',
      position_allowance: '',
      management_allowance: '',
      phone_allowance: '',
      incentive_allowance: '',
      overtime_allowance: ''
    });
  };

  const handleAddSalary = async () => {
    if (!formData.employee_id || !formData.nik || !formData.basic_salary) {
      toast({
        title: "Error",
        description: "Employee, NIK, dan Basic Salary wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Validasi nilai tidak boleh minus atau 0 untuk gaji pokok
    if (parseFloat(formData.basic_salary) <= 0) {
      toast({
        title: "Error",
        description: "Gaji Pokok harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    // Validasi nilai tidak boleh minus untuk tunjangan (jika diisi)
    if (formData.position_allowance && parseFloat(formData.position_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Jabatan tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.management_allowance && parseFloat(formData.management_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Manajemen tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.phone_allowance && parseFloat(formData.phone_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Telepon tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.incentive_allowance && parseFloat(formData.incentive_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Insentif tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.overtime_allowance && parseFloat(formData.overtime_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Lembur tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Data gaji berhasil ditambahkan"
        });
        setAddDialogOpen(false);
        resetForm();
        fetchSalaryData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menambahkan data gaji",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menambahkan data gaji",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSalary = async () => {
    if (!selectedRecord || !formData.basic_salary) {
      toast({
        title: "Error",
        description: "Basic Salary wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Validasi nilai tidak boleh minus atau 0 untuk gaji pokok
    if (parseFloat(formData.basic_salary) <= 0) {
      toast({
        title: "Error",
        description: "Gaji Pokok harus lebih dari 0",
        variant: "destructive"
      });
      return;
    }

    // Validasi nilai tidak boleh minus untuk tunjangan (jika diisi)
    if (formData.position_allowance && parseFloat(formData.position_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Jabatan tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.management_allowance && parseFloat(formData.management_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Manajemen tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.phone_allowance && parseFloat(formData.phone_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Telepon tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.incentive_allowance && parseFloat(formData.incentive_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Insentif tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    if (formData.overtime_allowance && parseFloat(formData.overtime_allowance) < 0) {
      toast({
        title: "Error",
        description: "Tunjangan Lembur tidak boleh minus",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/salary/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Data gaji berhasil diupdate"
        });
        setEditDialogOpen(false);
        setSelectedRecord(null);
        resetForm();
        fetchSalaryData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal mengupdate data gaji",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate data gaji",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSalary = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data gaji ini?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/salary/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Data gaji berhasil dihapus"
        });
        fetchSalaryData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus data gaji",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data gaji",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setFormData({
      employee_id: record.employee_id,
      nik: record.nik,
      basic_salary: record.basic_salary.toString(),
      position_allowance: record.position_allowance?.toString() || '',
      management_allowance: record.management_allowance?.toString() || '',
      phone_allowance: record.phone_allowance?.toString() || '',
      incentive_allowance: record.incentive_allowance?.toString() || '',
      overtime_allowance: record.overtime_allowance?.toString() || ''
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setCsvRows([]);
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = Array.isArray(res.data) ? (res.data as any[]) : [];
        setCsvRows(rows);
      },
      error: () => {
        setCsvRows([]);
      }
    });
  };

  const handleBulkUpload = async () => {
    if ((!csvFile && !csvData.trim()) && csvRows.length === 0) {
      toast({
        title: "Error",
        description: "File CSV belum dipilih",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      // Gunakan hasil parse Papa (csvRows). Jika user tetap paste manual, fallback parse sederhana
      let rows: any[] = csvRows;
      if (rows.length === 0 && csvData.trim()) {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        rows = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
      }

      // Mapping field yang didukung: wajib nik,basic_salary; opsional allowances
      const salaryData = rows.map((r) => ({
        nik: (r.nik ?? r.NIK ?? r.Nik ?? '').toString().trim(),
        basic_salary: (r.basic_salary ?? r.gaji_pokok ?? '').toString().trim(),
        position_allowance: (r.position_allowance ?? '').toString().trim(),
        management_allowance: (r.management_allowance ?? '').toString().trim(),
        phone_allowance: (r.phone_allowance ?? '').toString().trim(),
        incentive_allowance: (r.incentive_allowance ?? '').toString().trim(),
        overtime_allowance: (r.overtime_allowance ?? '').toString().trim(),
      }));

      const response = await fetch(`${API_URL}/api/salary/bulk-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ salaryData })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Berhasil",
          description: `${result.success} data berhasil diupload, ${result.errorCount || result.errors} error`
        });
        setUploadDialogOpen(false);
        setCsvData('');
        setCsvFile(null);
        setCsvRows([]);
        fetchSalaryData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal upload data gaji",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat upload data gaji",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        nik: employee.nik || ''
      }));
    }
  };

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="px-4 sm:px-0">
         <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Management Salary</h2>
         <p className="text-sm sm:text-base text-gray-600">Kelola data gaji karyawan dan komponen tunjangan</p>
       </div>

                    {/* Stats Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 sm:px-0">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-xs sm:text-sm font-medium">Total Karyawan</CardTitle>
             <Users className="h-4 w-4 text-blue-600" />
           </CardHeader>
           <CardContent>
             <div className="text-xl sm:text-2xl font-bold text-blue-600">{salaryData.length}</div>
             <p className="text-xs text-muted-foreground">Karyawan dengan gaji</p>
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-xs sm:text-sm font-medium">Total Gaji Pokok</CardTitle>
             <DollarSign className="h-4 w-4 text-green-600" />
           </CardHeader>
           <CardContent>
             <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalSalary)}</div>
             <p className="text-xs text-muted-foreground">Total gaji pokok</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-xs sm:text-sm font-medium">Total Tunjangan</CardTitle>
             <TrendingUp className="h-4 w-4 text-orange-600" />
           </CardHeader>
           <CardContent>
             <div className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(totalAllowances)}</div>
             <p className="text-xs text-muted-foreground">Total tunjangan</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-xs sm:text-sm font-medium">Total Gaji</CardTitle>
             <DollarSign className="h-4 w-4 text-purple-600" />
           </CardHeader>
           <CardContent>
             <div className="text-xl sm:text-2xl font-bold text-purple-600">{formatCurrency(totalSalary + totalAllowances)}</div>
             <p className="text-xs text-muted-foreground">Gaji + tunjangan</p>
           </CardContent>
         </Card>
       </div>

             {/* Action Buttons */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-0">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
           <Button onClick={() => setAddDialogOpen(true)} className="w-full sm:w-auto">
             <Plus className="h-4 w-4 mr-2" />
             Tambah Data
           </Button>
           <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto">
             <Upload className="h-4 w-4 mr-2" />
             Upload Data
           </Button>
         </div>
         <div className="flex items-center gap-2 w-full sm:w-auto">
           <div className="relative w-full sm:w-auto">
             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Cari karyawan, NIK, atau departemen..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-8 w-full sm:w-64"
             />
           </div>
         </div>
       </div>

             {/* Data Table */}
       <Card className="mx-4 sm:mx-0">
         <CardHeader>
           <CardTitle className="text-lg sm:text-xl">Daftar Gaji Karyawan</CardTitle>
           <CardDescription className="text-sm">Kelola semua data gaji dan tunjangan karyawan</CardDescription>
         </CardHeader>
         <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading data gaji...</p>
            </div>
          ) : (
                         <div className="overflow-x-auto -mx-4 sm:mx-0">
               <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Tunjangan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Update Terakhir</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data gaji'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => {
                      // Convert string to number if needed
                      const basicSalary = typeof item.basic_salary === 'string' ? parseFloat(item.basic_salary) || 0 : item.basic_salary || 0;
                      const posAllowance = typeof item.position_allowance === 'string' ? parseFloat(item.position_allowance) || 0 : item.position_allowance || 0;
                      const mgmtAllowance = typeof item.management_allowance === 'string' ? parseFloat(item.management_allowance) || 0 : item.management_allowance || 0;
                      const phoneAllowance = typeof item.phone_allowance === 'string' ? parseFloat(item.phone_allowance) || 0 : item.phone_allowance || 0;
                      const incentiveAllowance = typeof item.incentive_allowance === 'string' ? parseFloat(item.incentive_allowance) || 0 : item.incentive_allowance || 0;
                      const overtimeAllowance = typeof item.overtime_allowance === 'string' ? parseFloat(item.overtime_allowance) || 0 : item.overtime_allowance || 0;
                      
                      const totalAllowance = posAllowance + mgmtAllowance + phoneAllowance + incentiveAllowance + overtimeAllowance;
                      const total = basicSalary + totalAllowance;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.employee?.first_name} {item.employee?.last_name}
                          </TableCell>
                          <TableCell>{item.nik}</TableCell>
                          <TableCell>{item.employee?.departemen?.nama || '-'}</TableCell>
                          <TableCell>{formatCurrency(basicSalary)}</TableCell>
                          <TableCell>{formatCurrency(totalAllowance)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                          <TableCell>{formatDate(item.updated_at)}</TableCell>
                                                     <TableCell>
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => openViewDialog(item)}
                                 className="w-full sm:w-auto"
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => openEditDialog(item)}
                                 className="w-full sm:w-auto"
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                                 onClick={() => handleDeleteSalary(item.id)}
                                 disabled={processing}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

             {/* Add Salary Dialog */}
       <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-3xl mx-4">
           <DialogHeader>
             <DialogTitle>Tambah Data Gaji</DialogTitle>
           </DialogHeader>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Karyawan *</Label>
              <Select value={formData.employee_id} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.nik}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nik">NIK *</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                placeholder="NIK karyawan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basic_salary">Gaji Pokok *</Label>
              <Input
                id="basic_salary"
                type="number"
                min="0"
                step="0.01"
                value={formData.basic_salary}
                onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position_allowance">Tunjangan Jabatan</Label>
              <Input
                id="position_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.position_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, position_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="management_allowance">Tunjangan Manajemen</Label>
              <Input
                id="management_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.management_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, management_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_allowance">Tunjangan Telepon</Label>
              <Input
                id="phone_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.phone_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incentive_allowance">Tunjangan Insentif</Label>
              <Input
                id="incentive_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.incentive_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, incentive_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime_allowance">Tunjangan Lembur</Label>
              <Input
                id="overtime_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.overtime_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, overtime_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddSalary} disabled={processing}>
              {processing ? 'Menambahkan...' : 'Tambah Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

                           {/* View Salary Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                       <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-800">Detail Data Gaji</DialogTitle>
            </DialogHeader>
           {selectedRecord && (
             <div className="space-y-6 py-4">
                                               {/* Employee Info */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                          {selectedRecord.employee?.first_name || ''} {selectedRecord.employee?.last_name || ''}
                        </h2>
                        <p className="text-gray-600 mb-2">Karyawan</p>
                        <div className="flex items-center gap-4">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Building2 className="w-3 h-3 mr-1" />
                            {selectedRecord.employee?.departemen?.nama || 'Departemen tidak tersedia'}
                          </div>
                          <span className="text-sm text-gray-500 font-mono">{selectedRecord.nik || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Update Terakhir</p>
                            <p className="text-sm font-medium text-gray-800">{formatDate(selectedRecord.updated_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                               {/* Salary Breakdown */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Rincian Gaji</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-gray-700">Gaji Pokok</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(typeof selectedRecord.basic_salary === 'string' ? parseFloat(selectedRecord.basic_salary) || 0 : selectedRecord.basic_salary || 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-gray-700">Tunjangan Jabatan</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(typeof selectedRecord.position_allowance === 'string' ? parseFloat(selectedRecord.position_allowance) || 0 : selectedRecord.position_allowance || 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <span className="font-medium text-gray-700">Tunjangan Manajemen</span>
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(typeof selectedRecord.management_allowance === 'string' ? parseFloat(selectedRecord.management_allowance) || 0 : selectedRecord.management_allowance || 0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <span className="font-medium text-gray-700">Tunjangan Telepon</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(typeof selectedRecord.phone_allowance === 'string' ? parseFloat(selectedRecord.phone_allowance) || 0 : selectedRecord.phone_allowance || 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <span className="font-medium text-gray-700">Tunjangan Insentif</span>
                          <span className="font-semibold text-yellow-600">
                            {formatCurrency(typeof selectedRecord.incentive_allowance === 'string' ? parseFloat(selectedRecord.incentive_allowance) || 0 : selectedRecord.incentive_allowance || 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-gray-700">Tunjangan Lembur</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(typeof selectedRecord.overtime_allowance === 'string' ? parseFloat(selectedRecord.overtime_allowance) || 0 : selectedRecord.overtime_allowance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total Summary */}
                    <div className="border-t pt-6 mt-6 space-y-4">
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-lg font-medium text-gray-700">Total Tunjangan</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(
                            (typeof selectedRecord.position_allowance === 'string' ? parseFloat(selectedRecord.position_allowance) || 0 : selectedRecord.position_allowance || 0) +
                            (typeof selectedRecord.management_allowance === 'string' ? parseFloat(selectedRecord.management_allowance) || 0 : selectedRecord.management_allowance || 0) +
                            (typeof selectedRecord.phone_allowance === 'string' ? parseFloat(selectedRecord.phone_allowance) || 0 : selectedRecord.phone_allowance || 0) +
                            (typeof selectedRecord.incentive_allowance === 'string' ? parseFloat(selectedRecord.incentive_allowance) || 0 : selectedRecord.incentive_allowance || 0) +
                            (typeof selectedRecord.overtime_allowance === 'string' ? parseFloat(selectedRecord.overtime_allowance) || 0 : selectedRecord.overtime_allowance || 0)
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <span className="text-xl font-bold text-gray-800">Total Gaji</span>
                        <span className="text-3xl font-bold text-green-600">
                          {formatCurrency(
                            (typeof selectedRecord.basic_salary === 'string' ? parseFloat(selectedRecord.basic_salary) || 0 : selectedRecord.basic_salary || 0) +
                            (typeof selectedRecord.position_allowance === 'string' ? parseFloat(selectedRecord.position_allowance) || 0 : selectedRecord.position_allowance || 0) +
                            (typeof selectedRecord.management_allowance === 'string' ? parseFloat(selectedRecord.management_allowance) || 0 : selectedRecord.management_allowance || 0) +
                            (typeof selectedRecord.phone_allowance === 'string' ? parseFloat(selectedRecord.phone_allowance) || 0 : selectedRecord.phone_allowance || 0) +
                            (typeof selectedRecord.incentive_allowance === 'string' ? parseFloat(selectedRecord.incentive_allowance) || 0 : selectedRecord.incentive_allowance || 0) +
                            (typeof selectedRecord.overtime_allowance === 'string' ? parseFloat(selectedRecord.overtime_allowance) || 0 : selectedRecord.overtime_allowance || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
             </div>
           )}
           <DialogFooter>
             <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
               Tutup
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

               {/* Edit Salary Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
         <DialogContent className="max-w-2xl mx-4">
           <DialogHeader>
             <DialogTitle>Edit Data Gaji</DialogTitle>
           </DialogHeader>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nik">NIK</Label>
              <Input
                id="edit_nik"
                value={formData.nik}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_basic_salary">Gaji Pokok *</Label>
              <Input
                id="edit_basic_salary"
                type="number"
                min="0"
                step="0.01"
                value={formData.basic_salary}
                onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_position_allowance">Tunjangan Jabatan</Label>
              <Input
                id="edit_position_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.position_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, position_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_management_allowance">Tunjangan Manajemen</Label>
              <Input
                id="edit_management_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.management_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, management_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_phone_allowance">Tunjangan Telepon</Label>
              <Input
                id="edit_phone_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.phone_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_incentive_allowance">Tunjangan Insentif</Label>
              <Input
                id="edit_incentive_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.incentive_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, incentive_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_overtime_allowance">Tunjangan Lembur</Label>
              <Input
                id="edit_overtime_allowance"
                type="number"
                min="0"
                step="0.01"
                value={formData.overtime_allowance}
                onChange={(e) => setFormData(prev => ({ ...prev, overtime_allowance: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditSalary} disabled={processing}>
              {processing ? 'Mengupdate...' : 'Update Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Upload Data Dialog */}
       <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
         <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Upload Data Gaji Massal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="csv_file">File CSV</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input id="csv_file" type="file" accept=".csv" onChange={handleCsvFileChange} className="hidden" />
                  <label htmlFor="csv_file" className="cursor-pointer block">
                    <div className="text-sm font-medium text-gray-700 mb-1">{csvFile ? csvFile.name : 'Pilih file CSV'}</div>
                    <div className="text-xs text-gray-500">Klik untuk memilih file CSV atau drag & drop</div>
                    {csvRows.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">{csvRows.length} baris terdeteksi dari file</div>
                    )}
                  </label>
                </div>
              </div>

              {parsedHeaders.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Header terdeteksi:</div>
                  <div className="flex flex-wrap gap-2">
                    {parsedHeaders.map((h) => (
                      <Badge key={h} variant={lowerHeaders.includes(h.toLowerCase()) ? 'secondary' : 'outline'}>{h}</Badge>
                    ))}
                  </div>
                  {missingRequired.length > 0 && (
                    <div className="text-xs text-red-600">Header wajib belum lengkap: {missingRequired.join(', ')}</div>
                  )}
                </div>
              )}

              {csvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Preview (maks 5 baris)</div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {parsedHeaders.map((key) => (
                              <TableHead key={key} className="text-xs sticky top-0 bg-white whitespace-nowrap">{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvRows.slice(0,5).map((row, idx) => (
                            <TableRow key={idx}>
                              {parsedHeaders.map((key) => (
                                <TableCell key={key} className="text-xs whitespace-nowrap">{row[key] ?? '-'}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p>Format header CSV yang diharapkan:</p>
                <p className="font-mono">nik,basic_salary,position_allowance,management_allowance,phone_allowance,incentive_allowance,overtime_allowance</p>
                <p className="mt-2">Contoh baris:</p>
                <p className="font-mono">EMP001,5000000,500000,300000,100000,200000,150000</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setCsvFile(null); setCsvRows([]); setCsvData(''); }}>
              Batal
            </Button>
            <Button onClick={handleBulkUpload} disabled={processing || missingRequired.length > 0 || (csvRows.length === 0 && !csvData.trim())}>
              {processing ? 'Mengupload...' : 'Upload Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
