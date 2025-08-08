import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';

interface LeaveQuota {
  id: number;
  employee_id: string;
  quota_type: string;
  year: number;
  total_quota: number;
  used_quota: number;
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

const CURRENT_YEAR = new Date().getFullYear();

export const LeaveQuotaContent = () => {
  const { data: employees = [] } = useEmployees();
  const { toast } = useToast();
  const [quotas, setQuotas] = useState<LeaveQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string | number>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    employee_id: '',
    year: CURRENT_YEAR,
    total_quota: '',
    quota_type: 'tahunan'
  });

  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/leave-quotas`);
      if (response.ok) {
        const data = await response.json();
        setQuotas(data);
      }
    } catch (error) {
      console.error('Error fetching quotas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const filteredQuotas = quotas.filter(quota => {
    const matchesSearch = `${quota.employee?.first_name} ${quota.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.quota_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.employee?.departemen?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = filterYear === 'all' || quota.year === Number(filterYear);
    
    return matchesSearch && matchesYear;
  });

  const resetForm = () => {
    setForm({
      employee_id: '',
      year: CURRENT_YEAR,
      total_quota: '',
      quota_type: 'tahunan'
    });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `${API_URL}/api/leave-quotas/${editId}` : `${API_URL}/api/leave-quotas`;
      const method = editId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          total_quota: Number(form.total_quota)
        })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: editId ? "Quota cuti berhasil diupdate" : "Quota cuti berhasil ditambahkan"
        });
        setDialogOpen(false);
        resetForm();
        fetchQuotas();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menyimpan quota cuti",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (quota: LeaveQuota) => {
    setForm({
      employee_id: quota.employee_id,
      year: quota.year,
      total_quota: quota.total_quota.toString(),
      quota_type: quota.quota_type
    });
    setEditId(quota.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/leave-quotas/${deleteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Quota cuti berhasil dihapus"
        });
        setDeleteDialogOpen(false);
        setDeleteId(null);
        fetchQuotas();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus quota cuti",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus data",
        variant: "destructive"
      });
    }
  };

  const getQuotaStatus = (quota: LeaveQuota) => {
    const remaining = quota.total_quota - quota.used_quota;
    const percentage = (quota.used_quota / quota.total_quota) * 100;
    
    if (percentage >= 90) {
      return { color: 'text-red-600 border-red-300', label: 'Hampir Habis' };
    } else if (percentage >= 70) {
      return { color: 'text-orange-600 border-orange-300', label: 'Terbatas' };
    } else {
      return { color: 'text-green-600 border-green-300', label: 'Tersedia' };
    }
  };

  const getYearOptions = () => {
    const years = Array.from(new Set(quotas.map(q => q.year)));
    const baseYears = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);
    return Array.from(new Set([...baseYears, ...years])).sort((a, b) => b - a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Management Quota Cuti</h2>
        <p className="text-gray-600">Kelola kuota cuti tahunan karyawan</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Quota Cuti</CardTitle>
              <CardDescription>Kelola kuota cuti untuk semua karyawan</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari karyawan atau departemen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={filterYear.toString()} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {getYearOptions().map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Quota
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editId ? 'Edit Quota Cuti' : 'Tambah Quota Cuti'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="employee_id">Karyawan</Label>
                      <Select value={form.employee_id} onValueChange={(value) => setForm(prev => ({ ...prev, employee_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih karyawan" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name} - {emp.departemen?.nama || emp.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">Tahun</Label>
                      <Input
                        id="year"
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                        min={2020}
                        max={2030}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quota_type">Jenis Cuti</Label>
                      <Select value={form.quota_type} onValueChange={(value) => setForm(prev => ({ ...prev, quota_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tahunan">Tahunan</SelectItem>
                          <SelectItem value="besar">Cuti Besar</SelectItem>
                          <SelectItem value="sakit">Sakit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="total_quota">Total Quota (Hari)</Label>
                      <Input
                        id="total_quota"
                        type="number"
                        value={form.total_quota}
                        onChange={(e) => setForm(prev => ({ ...prev, total_quota: e.target.value }))}
                        min={0}
                        max={365}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit">
                        {editId ? 'Update' : 'Tambah'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading data quota cuti...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Total Quota</TableHead>
                    <TableHead>Terpakai</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterYear !== 'all' ? 'Tidak ada data yang sesuai dengan filter' : 'Tidak ada data quota cuti'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotas.map((quota) => {
                      const status = getQuotaStatus(quota);
                      const remaining = quota.total_quota - quota.used_quota;
                      
                      return (
                        <TableRow key={quota.id}>
                          <TableCell className="font-medium">
                            {quota.employee?.first_name} {quota.employee?.last_name}
                          </TableCell>
                          <TableCell>{quota.employee?.departemen?.nama || '-'}</TableCell>
                          <TableCell>{quota.year}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{quota.quota_type}</Badge>
                          </TableCell>
                          <TableCell>{quota.total_quota} hari</TableCell>
                          <TableCell>{quota.used_quota} hari</TableCell>
                          <TableCell className="font-medium">{remaining} hari</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(quota)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setDeleteId(quota.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus quota cuti ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};