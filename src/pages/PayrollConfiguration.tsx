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
  Settings,
  FileText,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { usePayrollComponents } from '@/hooks/usePayrollComponents';

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
  const { 
    components, 
    stats, 
    loading, 
    error, 
    updateComponent, 
    deleteComponent, 
    toggleActive 
  } = usePayrollComponents();

  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);

  const handleEdit = (component: PayrollComponent) => {
    setEditingComponent(component);
  };

  const handleSave = async (component: PayrollComponent) => {
    try {
      await updateComponent(component.id, component);
      setEditingComponent(null);
      toast({
        title: 'Berhasil',
        description: 'Komponen payroll berhasil diupdate',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengupdate komponen',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id);
      toast({
        title: 'Berhasil',
        description: 'Status komponen berhasil diubah',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengubah status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteComponent(id);
      toast({
        title: 'Berhasil',
        description: 'Komponen payroll berhasil dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus komponen',
        variant: 'destructive',
      });
    }
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
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Komponen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat konfigurasi payroll...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                                 <div>
                   <p className="text-sm text-gray-600">Total Pendapatan</p>
                   <p className="text-2xl font-bold text-gray-900">{stats?.income_count || 0}</p>
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
                   <p className="text-2xl font-bold text-gray-900">{stats?.deduction_count || 0}</p>
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
                   <p className="text-2xl font-bold text-gray-900">{stats?.bpjs_count || 0}</p>
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
                   <p className="text-2xl font-bold text-gray-900">{stats?.active_count || 0}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>

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
            </>
          )}

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