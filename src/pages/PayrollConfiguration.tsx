import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Calculator,
  DollarSign,
  Percent,
  Settings,
  FileText,
  CreditCard,
  Shield,
  Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';

interface PayrollComponent {
  id: string;
  name: string;
  type: 'income' | 'deduction';
  category: 'fixed' | 'variable' | 'bpjs' | 'allowance';
  percentage: number;
  amount: number;
  is_active: boolean;
  description: string;
}

const PayrollConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State untuk komponen payroll
  const [components, setComponents] = useState<PayrollComponent[]>([
    // Pendapatan Tetap
    {
      id: 'basic_salary',
      name: 'Gaji Pokok',
      type: 'income',
      category: 'fixed',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Gaji pokok karyawan'
    },
    // BPJS Ketenagakerjaan
    {
      id: 'bpjs_jht_company',
      name: 'BPJS Ketenagakerjaan JHT (Perusahaan)',
      type: 'income',
      category: 'bpjs',
      percentage: 3.7,
      amount: 0,
      is_active: true,
      description: 'Jaminan Hari Tua dari perusahaan'
    },
    {
      id: 'bpjs_jkm_company',
      name: 'BPJS Ketenagakerjaan JKM (Perusahaan)',
      type: 'income',
      category: 'bpjs',
      percentage: 0.3,
      amount: 0,
      is_active: true,
      description: 'Jaminan Kematian dari perusahaan'
    },
    {
      id: 'bpjs_jkk_company',
      name: 'BPJS Ketenagakerjaan JKK (Perusahaan)',
      type: 'income',
      category: 'bpjs',
      percentage: 0.24,
      amount: 0,
      is_active: true,
      description: 'Jaminan Kecelakaan Kerja dari perusahaan'
    },
    {
      id: 'bpjs_pension_company',
      name: 'BPJS Jaminan Pensiun (Perusahaan)',
      type: 'income',
      category: 'bpjs',
      percentage: 2,
      amount: 0,
      is_active: true,
      description: 'Jaminan Pensiun dari perusahaan'
    },
    {
      id: 'bpjs_health_company',
      name: 'BPJS Kesehatan (Perusahaan)',
      type: 'income',
      category: 'bpjs',
      percentage: 4,
      amount: 0,
      is_active: true,
      description: 'BPJS Kesehatan dari perusahaan'
    },
    // Pendapatan Tidak Tetap
    {
      id: 'position_allowance',
      name: 'Tunjangan Jabatan',
      type: 'income',
      category: 'allowance',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Tunjangan berdasarkan jabatan'
    },
    {
      id: 'management_allowance',
      name: 'Tunjangan Pengurus',
      type: 'income',
      category: 'allowance',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Tunjangan untuk pengurus'
    },
    {
      id: 'phone_allowance',
      name: 'Tunjangan Pulsa',
      type: 'income',
      category: 'allowance',
      percentage: 0,
      amount: 100000,
      is_active: true,
      description: 'Tunjangan pulsa bulanan'
    },
    {
      id: 'incentive_allowance',
      name: 'Tunjangan Insentif',
      type: 'income',
      category: 'allowance',
      percentage: 0,
      amount: 500000,
      is_active: true,
      description: 'Tunjangan insentif kinerja'
    },
    {
      id: 'overtime_allowance',
      name: 'Tunjangan Lembur',
      type: 'income',
      category: 'allowance',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Tunjangan lembur'
    },
    // Pemotongan Karyawan
    {
      id: 'bpjs_health_employee',
      name: 'BPJS Kesehatan (Karyawan)',
      type: 'deduction',
      category: 'bpjs',
      percentage: 1,
      amount: 0,
      is_active: true,
      description: 'BPJS Kesehatan dari karyawan'
    },
    {
      id: 'bpjs_jht_employee',
      name: 'BPJS Ketenagakerjaan JHT (Karyawan)',
      type: 'deduction',
      category: 'bpjs',
      percentage: 2,
      amount: 0,
      is_active: true,
      description: 'Jaminan Hari Tua dari karyawan'
    },
    {
      id: 'bpjs_pension_employee',
      name: 'BPJS Jaminan Pensiun (Karyawan)',
      type: 'deduction',
      category: 'bpjs',
      percentage: 1,
      amount: 0,
      is_active: true,
      description: 'Jaminan Pensiun dari karyawan'
    },
    {
      id: 'cash_advance',
      name: 'Kasbon',
      type: 'deduction',
      category: 'variable',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Pinjaman kasbon'
    },
    {
      id: 'loan_installment',
      name: 'Angsuran Kredit',
      type: 'deduction',
      category: 'variable',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Angsuran kredit karyawan'
    },
    {
      id: 'late_penalty',
      name: 'Telat',
      type: 'deduction',
      category: 'variable',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Denda keterlambatan'
    },
    {
      id: 'absent_penalty',
      name: 'Alfa',
      type: 'deduction',
      category: 'variable',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: 'Denda ketidakhadiran'
    }
  ]);

  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleEdit = (component: PayrollComponent) => {
    setEditingComponent(component);
  };

  const handleSave = (component: PayrollComponent) => {
    setComponents(prev => 
      prev.map(c => c.id === component.id ? component : c)
    );
    setEditingComponent(null);
    toast({
      title: 'Berhasil',
      description: 'Komponen payroll berhasil diupdate',
    });
  };

  const handleToggleActive = (id: string) => {
    setComponents(prev => 
      prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)
    );
  };

  const handleDelete = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    toast({
      title: 'Berhasil',
      description: 'Komponen payroll berhasil dihapus',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fixed': return <DollarSign className="w-4 h-4" />;
      case 'bpjs': return <Shield className="w-4 h-4" />;
      case 'allowance': return <Plus className="w-4 h-4" />;
      case 'variable': return <Calculator className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'bpjs': return 'bg-purple-100 text-purple-800';
      case 'allowance': return 'bg-yellow-100 text-yellow-800';
      case 'variable': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Konfigurasi Payroll</h1>
                <p className="text-gray-600">Kelola komponen perhitungan gaji otomatis</p>
              </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Komponen
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-gray-900">11</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Calculator className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pemotongan</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Komponen BPJS</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">17</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Components Table */}
        <Card>
          <CardHeader>
            <CardTitle>Komponen Payroll</CardTitle>
            <CardDescription>
              Kelola komponen perhitungan gaji otomatis berdasarkan slip gaji
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead>Jumlah Tetap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{component.name}</p>
                        <p className="text-sm text-gray-500">{component.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(component.type)}>
                        {component.type === 'income' ? 'Pendapatan' : 'Pemotongan'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(component.category)}>
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(component.category)}
                          {component.category === 'fixed' && 'Tetap'}
                          {component.category === 'bpjs' && 'BPJS'}
                          {component.category === 'allowance' && 'Tunjangan'}
                          {component.category === 'variable' && 'Variabel'}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {component.percentage > 0 ? (
                        <span className="font-mono">{component.percentage}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {component.amount > 0 ? (
                        <span className="font-mono">
                          Rp {component.amount.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={component.is_active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleActive(component.id)}
                      >
                        {component.is_active ? 'Aktif' : 'Nonaktif'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(component.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Komponen Payroll</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Komponen</Label>
                <Input
                  id="name"
                  value={editingComponent.name}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={editingComponent.description}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    description: e.target.value
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="percentage">Persentase (%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    step="0.01"
                    value={editingComponent.percentage}
                    onChange={(e) => setEditingComponent({
                      ...editingComponent,
                      percentage: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Jumlah Tetap</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={editingComponent.amount}
                    onChange={(e) => setEditingComponent({
                      ...editingComponent,
                      amount: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSave(editingComponent)}>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
                <Button variant="outline" onClick={() => setEditingComponent(null)}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollConfiguration; 