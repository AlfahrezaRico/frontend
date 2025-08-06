import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Shield,
  Filter,
  Search,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';

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

// Mock data untuk development
const mockComponents: PayrollComponent[] = [
  {
    id: 1,
    name: 'Gaji Pokok',
    type: 'income',
    category: 'fixed',
    percentage: 0,
    amount: 0,
    is_active: true,
    description: 'Gaji pokok karyawan'
  },
  {
    id: 2,
    name: 'BPJS Ketenagakerjaan JHT (Perusahaan)',
    type: 'income',
    category: 'bpjs',
    percentage: 3.7,
    amount: 0,
    is_active: true,
    description: 'Jaminan Hari Tua dari perusahaan'
  },
  {
    id: 3,
    name: 'BPJS Ketenagakerjaan JHT (Karyawan)',
    type: 'deduction',
    category: 'bpjs',
    percentage: 2,
    amount: 0,
    is_active: true,
    description: 'Jaminan Hari Tua dari karyawan'
  },
  {
    id: 4,
    name: 'Tunjangan Makan',
    type: 'income',
    category: 'allowance',
    percentage: 0,
    amount: 50000,
    is_active: true,
    description: 'Tunjangan makan harian'
  },
  {
    id: 5,
    name: 'Kasbon',
    type: 'deduction',
    category: 'variable',
    percentage: 0,
    amount: 0,
    is_active: true,
    description: 'Pinjaman karyawan'
  }
];

const PayrollConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('PayrollConfiguration component rendered'); // Debug log
  
  const [components, setComponents] = useState<PayrollComponent[]>(mockComponents);
  const [filteredComponents, setFilteredComponents] = useState<PayrollComponent[]>(mockComponents);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newComponent, setNewComponent] = useState<Omit<PayrollComponent, 'id'>>({
    name: '',
    type: 'income',
    category: 'fixed',
    percentage: 0,
    amount: 0,
    is_active: true,
    description: ''
  });

  // Debug log when component mounts
  useEffect(() => {
    console.log('PayrollConfiguration component mounted');
    console.log('Current components:', components);
    
    // Prevent any automatic redirects
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('Preventing page unload');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Filter components
  const filterComponents = () => {
    let filtered = components;

    if (searchTerm) {
      filtered = filtered.filter(comp => 
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(comp => comp.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(comp => comp.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(comp => comp.is_active === isActive);
    }

    setFilteredComponents(filtered);
  };

  // Apply filters when any filter changes
  useEffect(() => {
    filterComponents();
  }, [searchTerm, typeFilter, categoryFilter, statusFilter, components]);

  const handleAddComponent = () => {
    if (!newComponent.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama komponen harus diisi',
        variant: 'destructive',
      });
      return;
    }

    const component: PayrollComponent = {
      ...newComponent,
      id: Math.max(...components.map(c => c.id)) + 1
    };

    setComponents(prev => [...prev, component]);
    setNewComponent({
      name: '',
      type: 'income',
      category: 'fixed',
      percentage: 0,
      amount: 0,
      is_active: true,
      description: ''
    });
    setShowAddDialog(false);
    
    toast({
      title: 'Berhasil',
      description: 'Komponen payroll berhasil ditambahkan',
    });
  };

  const handleEdit = (component: PayrollComponent) => {
    setEditingComponent(component);
  };

  const handleSave = async (component: PayrollComponent) => {
    setComponents(prev => 
      prev.map(c => c.id === component.id ? component : c)
    );
    setEditingComponent(null);
    toast({
      title: 'Berhasil',
      description: 'Komponen payroll berhasil diupdate',
    });
  };

  const handleToggleActive = async (id: number) => {
    setComponents(prev => 
      prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)
    );
    toast({
      title: 'Berhasil',
      description: 'Status komponen berhasil diubah',
    });
  };

  const handleDelete = async (id: number) => {
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

  const stats = {
    total: components.length,
    income_count: components.filter(c => c.type === 'income').length,
    deduction_count: components.filter(c => c.type === 'deduction').length,
    bpjs_count: components.filter(c => c.category === 'bpjs').length,
    active_count: components.filter(c => c.is_active).length
  };

  console.log('PayrollConfiguration rendering with stats:', stats); // Debug log

  // Error boundary - catch any errors and prevent redirect
  try {
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
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Komponen
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.income_count}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.deduction_count}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.bpjs_count}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.active_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Pencarian</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari komponen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Tipe</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="income">Pendapatan</SelectItem>
                      <SelectItem value="deduction">Pemotongan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="fixed">Tetap</SelectItem>
                      <SelectItem value="bpjs">BPJS</SelectItem>
                      <SelectItem value="allowance">Tunjangan</SelectItem>
                      <SelectItem value="variable">Variabel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components Table */}
          <Card>
            <CardHeader>
              <CardTitle>Komponen Payroll</CardTitle>
              <CardDescription>
                Kelola komponen perhitungan gaji otomatis berdasarkan slip gaji
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredComponents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada komponen</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tidak ada komponen yang sesuai dengan filter yang dipilih.'
                      : 'Belum ada komponen payroll. Silakan tambahkan komponen pertama.'
                    }
                  </p>
                  {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' ? (
                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}>
                      <X className="w-4 h-4 mr-2" />
                      Reset Filter
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Komponen Pertama
                    </Button>
                  )}
                </div>
              ) : (
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
                    {filteredComponents.map((component) => (
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Component Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Tambah Komponen Payroll</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-name">Nama Komponen</Label>
                  <Input
                    id="new-name"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent({
                      ...newComponent,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-description">Deskripsi</Label>
                  <Input
                    id="new-description"
                    value={newComponent.description}
                    onChange={(e) => setNewComponent({
                      ...newComponent,
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipe</Label>
                    <Select value={newComponent.type} onValueChange={(value: 'income' | 'deduction') => setNewComponent({
                      ...newComponent,
                      type: value
                    })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pendapatan</SelectItem>
                        <SelectItem value="deduction">Pemotongan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select value={newComponent.category} onValueChange={(value: 'fixed' | 'variable' | 'bpjs' | 'allowance') => setNewComponent({
                      ...newComponent,
                      category: value
                    })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Tetap</SelectItem>
                        <SelectItem value="bpjs">BPJS</SelectItem>
                        <SelectItem value="allowance">Tunjangan</SelectItem>
                        <SelectItem value="variable">Variabel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-percentage">Persentase (%)</Label>
                    <Input
                      id="new-percentage"
                      type="number"
                      step="0.01"
                      value={newComponent.percentage}
                      onChange={(e) => setNewComponent({
                        ...newComponent,
                        percentage: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-amount">Jumlah Tetap</Label>
                    <Input
                      id="new-amount"
                      type="number"
                      value={newComponent.amount}
                      onChange={(e) => setNewComponent({
                        ...newComponent,
                        amount: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddComponent}>
                    <Save className="w-4 h-4 mr-2" />
                    Tambah
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Component Dialog */}
        {editingComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Komponen Payroll</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nama Komponen</Label>
                  <Input
                    id="edit-name"
                    value={editingComponent.name}
                    onChange={(e) => setEditingComponent({
                      ...editingComponent,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Input
                    id="edit-description"
                    value={editingComponent.description}
                    onChange={(e) => setEditingComponent({
                      ...editingComponent,
                      description: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-percentage">Persentase (%)</Label>
                    <Input
                      id="edit-percentage"
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
                    <Label htmlFor="edit-amount">Jumlah Tetap</Label>
                    <Input
                      id="edit-amount"
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
  } catch (error) {
    console.error('Error in PayrollConfiguration:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Payroll Configuration</h1>
          <p className="text-gray-600 mb-4">Terjadi kesalahan saat memuat halaman konfigurasi payroll.</p>
          <Button onClick={() => navigate(-1)}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }
};

export default PayrollConfiguration; 