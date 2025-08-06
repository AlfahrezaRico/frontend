import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Settings, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Building, TestTube, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

import { useNIKConfiguration } from '@/hooks/useNIKConfiguration';
import { NIKConfigurationDialog } from '@/components/NIKConfigurationDialog';

export default function NIKConfiguration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    configurations, 
    loading, 
    error, 
    fetchConfigurations, 
    deleteConfiguration,
    generateNextNIKForDepartment,
    getAvailableDepartments
  } = useNIKConfiguration();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<any>(null);
  const [generatedNIK, setGeneratedNIK] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedConfig(null);
    setDialogOpen(true);
  };

  const handleEdit = (config: any) => {
    setDialogMode('edit');
    setSelectedConfig(config);
    setDialogOpen(true);
  };

  const handleDelete = (config: any) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  // Tutup dialog tanpa refresh
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedConfig(null);
  };

  // Handle setelah create/update berhasil
  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setSelectedConfig(null);
    
    // Auto-refresh data
    fetchConfigurations();
    
    // Toast notification
    if (dialogMode === 'create') {
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi NIK berhasil dibuat',
      });
    } else {
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi NIK berhasil diperbarui',
      });
    }
  };

  const confirmDelete = async () => {
    if (configToDelete) {
      try {
        await deleteConfiguration(configToDelete.id);
        setDeleteDialogOpen(false);
        setConfigToDelete(null);
        setLocalError(null);
        
        // Auto-refresh data
        fetchConfigurations();
        
        // Toast notification
        toast({
          title: 'Berhasil',
          description: 'Konfigurasi NIK berhasil dihapus',
        });
      } catch (err) {
        console.error('Error deleting configuration:', err);
        setLocalError('Gagal menghapus konfigurasi. Silakan coba lagi.');
        
        // Toast error
        toast({
          title: 'Error',
          description: 'Gagal menghapus konfigurasi NIK',
          variant: 'destructive',
        });
      }
    }
  };

  const handleGenerateTestNIK = async () => {
    if (!selectedDepartment) {
      setLocalError('Pilih departemen terlebih dahulu');
      return;
    }
    try {
      const nik = await generateNextNIKForDepartment(selectedDepartment);
      setGeneratedNIK(nik);
      setLocalError(null);
      
      // Auto-refresh data
      fetchConfigurations();
      
      // Toast notification
      toast({
        title: 'Berhasil',
        description: `NIK test berhasil di-generate: ${nik}`,
      });
    } catch (err) {
      console.error('Error generating test NIK:', err);
      setLocalError('Gagal generate NIK test. Pastikan konfigurasi departemen sudah dibuat.');
      
      // Toast error
      toast({
        title: 'Error',
        description: 'Gagal generate NIK test',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Aktif
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Nonaktif
      </Badge>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat konfigurasi NIK...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header dengan tombol kembali */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/superadmin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Konfigurasi NIK per Departemen</h1>
              <p className="text-gray-600">Kelola pengaturan auto-generate NIK karyawan berdasarkan departemen</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Buat Konfigurasi
          </Button>
        </div>

        {/* Error Display */}
        {(error || localError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || localError}
              {error && (
                <div className="mt-2 text-sm">
                  <p>Tips troubleshooting:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Pastikan backend berjalan di Railway</li>
                    <li>Pastikan database sudah disiapkan dengan script SQL</li>
                    <li>Cek console browser untuk error detail</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Memuat konfigurasi NIK...</span>
          </div>
        )}

        {/* Content - hanya tampilkan jika tidak loading */}
        {!loading && (
          <>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Test dan generate NIK untuk departemen tertentu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="department-select" className="text-sm text-gray-600">Departemen:</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger id="department-select" className="w-48">
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableDepartments().length > 0 ? (
                          getAvailableDepartments().map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-departments" disabled>
                            Tidak ada departemen tersedia
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleGenerateTestNIK}
                    disabled={loading || !selectedDepartment}
                    variant="outline"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Generate Test NIK
                  </Button>
                  {generatedNIK && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Hasil:</span>
                      <Badge variant="outline" className="font-mono text-lg">
                        {generatedNIK}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configurations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Konfigurasi NIK per Departemen</CardTitle>
                <CardDescription>
                  Semua konfigurasi NIK yang telah dibuat untuk setiap departemen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configurations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      Belum ada konfigurasi NIK. Buat konfigurasi pertama Anda.
                    </div>
                    <Button onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Konfigurasi Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Total: {configurations.length} konfigurasi
                      </div>
                      <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Konfigurasi
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Departemen</TableHead>
                          <TableHead>Prefix</TableHead>
                          <TableHead>Sequence</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configurations.map((config) => (
                          <TableRow key={config.id}>
                            <TableCell className="font-medium">
                              {config.department_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {config.prefix}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {config.current_sequence.toString().padStart(config.sequence_length, '0')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  / {config.sequence_length} digit
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {config.format_pattern}
                              </code>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(config.is_active)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {format(new Date(config.created_at), 'dd MMM yyyy', { locale: id })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(config)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(config)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus konfigurasi NIK untuk departemen "{configToDelete?.department_name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Configuration Dialog */}
        <NIKConfigurationDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          configuration={selectedConfig}
          mode={dialogMode}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </div>
  );
} 