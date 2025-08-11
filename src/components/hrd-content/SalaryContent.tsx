import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Plus, Upload, Edit, Trash2, DollarSign, Users, TrendingUp } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SalaryRecord {
  id: string;
  employee_id: string;
  nik: string;
  basic_salary: number;
  position_allowance?: number;
  management_allowance?: number;
  phone_allowance?: number;
  incentive_allowance?: number;
  overtime_allowance?: number;
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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  
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

  const totalSalary = salaryData.reduce((sum, item) => sum + item.basic_salary, 0);
  const totalAllowances = salaryData.reduce((sum, item) => 
    sum + (item.position_allowance || 0) + (item.management_allowance || 0) + 
    (item.phone_allowance || 0) + (item.incentive_allowance || 0) + (item.overtime_allowance || 0), 0
  );

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

  const handleBulkUpload = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Data CSV tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Parse CSV data (simple parsing for demonstration)
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const salaryData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        salaryData.push(row);
      }

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
          description: `${result.success} data berhasil diupload, ${result.errors} error`
        });
        setUploadDialogOpen(false);
        setCsvData('');
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Management Salary</h2>
        <p className="text-gray-600">Kelola data gaji karyawan dan komponen tunjangan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{salaryData.length}</div>
            <p className="text-xs text-muted-foreground">Karyawan dengan gaji</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gaji Pokok</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSalary)}</div>
            <p className="text-xs text-muted-foreground">Total gaji pokok</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tunjangan</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalAllowances)}</div>
            <p className="text-xs text-muted-foreground">Total tunjangan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gaji</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalSalary + totalAllowances)}</div>
            <p className="text-xs text-muted-foreground">Gaji + tunjangan</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Data
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari karyawan, NIK, atau departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Gaji Karyawan</CardTitle>
          <CardDescription>Kelola semua data gaji dan tunjangan karyawan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading data gaji...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
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
                      const totalAllowance = (item.position_allowance || 0) + 
                        (item.management_allowance || 0) + (item.phone_allowance || 0) + 
                        (item.incentive_allowance || 0) + (item.overtime_allowance || 0);
                      const total = item.basic_salary + totalAllowance;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.employee?.first_name} {item.employee?.last_name}
                          </TableCell>
                          <TableCell>{item.nik}</TableCell>
                          <TableCell>{item.employee?.departemen?.nama || '-'}</TableCell>
                          <TableCell>{formatCurrency(item.basic_salary)}</TableCell>
                          <TableCell>{formatCurrency(totalAllowance)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(total)}</TableCell>
                          <TableCell>{formatDate(item.updated_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Data Gaji</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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

      {/* Edit Salary Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Gaji</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Data Gaji Massal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv_data">Data CSV</Label>
                <Textarea
                  id="csv_data"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste data CSV di sini..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Format CSV yang diharapkan:</p>
                <p className="font-mono">employee_id,nik,basic_salary,position_allowance,management_allowance,phone_allowance,incentive_allowance,overtime_allowance</p>
                <p className="mt-2">Contoh:</p>
                <p className="font-mono">uuid-123,EMP001,5000000,500000,300000,100000,200000,150000</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBulkUpload} disabled={processing}>
              {processing ? 'Mengupload...' : 'Upload Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
