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

interface PayrollStats {
  total: number;
  income_count: number;
  deduction_count: number;
  bpjs_count: number;
  active_count: number;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const PayrollConfiguration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<PayrollComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PayrollStats>({
    total: 0,
    income_count: 0,
    deduction_count: 0,
    bpjs_count: 0,
    active_count: 0
  });
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

  // Fetch components from backend
  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payroll-components`);
      if (!res.ok) throw new Error('Failed to fetch components');
      const data = await res.json();
      setComponents(data);
    } catch (error) {
      console.error('Error fetching components:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data komponen payroll',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/payroll-components/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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

  const handleAddComponent = async () => {
    if (!newComponent.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama komponen harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/payroll-components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComponent),
      });

      if (!res.ok) throw new Error('Failed to add component');
      
      const addedComponent = await res.json();
      setComponents(prev => [...prev, addedComponent]);
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
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error adding component:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan komponen payroll',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (component: PayrollComponent) => {
    setEditingComponent(component);
  };

  const handleSave = async (component: PayrollComponent) => {
    try {
      const res = await fetch(`${API_URL}/api/payroll-components/${component.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(component),
      });

      if (!res.ok) throw new Error('Failed to update component');
      
      const updatedComponent = await res.json();
      setComponents(prev => 
        prev.map(c => c.id === component.id ? updatedComponent : c)
      );
      setEditingComponent(null);
      
      toast({
        title: 'Berhasil',
        description: 'Komponen payroll berhasil diupdate',
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating component:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengupdate komponen payroll',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/payroll-components/${id}/toggle`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to toggle component');
      
      const updatedComponent = await res.json();
      setComponents(prev => 
        prev.map(c => c.id === id ? updatedComponent : c)
      );
      
      toast({
        title: 'Berhasil',
        description: 'Status komponen berhasil diubah',
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error toggling component:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status komponen',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin hapus komponen ini?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/payroll-components/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete component');
      
      setComponents(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: 'Berhasil',
        description: 'Komponen payroll berhasil dihapus',
      });
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting component:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus komponen payroll',
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
                    <Label>Tipe</Label>
                    <Select value={editingComponent.type} onValueChange={(value: 'income' | 'deduction') => setEditingComponent({
                      ...editingComponent,
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
                    <Select value={editingComponent.category} onValueChange={(value: 'fixed' | 'variable' | 'bpjs' | 'allowance') => setEditingComponent({
                      ...editingComponent,
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