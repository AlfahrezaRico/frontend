import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, TestTube, Zap, Building, Plus } from 'lucide-react';
import { useNIKConfiguration, DepartmentNIKConfigurationForm } from '@/hooks/useNIKConfiguration';
import { useToast } from '@/hooks/use-toast';

interface NIKConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration?: any;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

export function NIKConfigurationDialog({ open, onOpenChange, configuration, mode, onSuccess }: NIKConfigurationDialogProps) {
  const { createConfiguration, updateConfiguration, generateNextNIKForDepartment, testNIKFormatForDepartment, loading, error } = useNIKConfiguration();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<DepartmentNIKConfigurationForm>({
    department_id: '',
    department_name: '',
    prefix: '', // Biarkan kosong, user akan isi sendiri
    current_sequence: 1,
    sequence_length: 3,
    format_pattern: 'PREFIX + SEQUENCE',
    is_active: false,
  });

  const [previewNIK, setPreviewNIK] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [generatedNIK, setGeneratedNIK] = useState<string>('');
  const [departments, setDepartments] = useState<any[]>([]);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        if (API_URL) {
          const res = await fetch(`${API_URL}/api/departemen`);
          if (res.ok) {
            const data = await res.json();
            setDepartments(data);
          } else {
            // Fallback to mock departments
            setDepartments([
              { id: '1', nama: 'IT' },
              { id: '2', nama: 'HR' },
              { id: '3', nama: 'Finance' },
              { id: '4', nama: 'Marketing' },
              { id: '5', nama: 'Operations' },
              { id: '6', nama: 'Sales' },
              { id: '7', nama: 'General' }
            ]);
          }
        } else {
          // Mock departments if no API URL
          setDepartments([
            { id: '1', nama: 'IT' },
            { id: '2', nama: 'HR' },
            { id: '3', nama: 'Finance' },
            { id: '4', nama: 'Marketing' },
            { id: '5', nama: 'Operations' },
            { id: '6', nama: 'Sales' },
            { id: '7', nama: 'General' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        // Fallback to mock departments
        setDepartments([
          { id: '1', nama: 'IT' },
          { id: '2', nama: 'HR' },
          { id: '3', nama: 'Finance' },
          { id: '4', nama: 'Marketing' },
          { id: '5', nama: 'Operations' },
          { id: '6', nama: 'Sales' },
          { id: '7', nama: 'General' }
        ]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    if (configuration && mode === 'edit') {
      setFormData({
        department_id: configuration.department_id || '',
        department_name: configuration.department_name,
        prefix: configuration.prefix,
        current_sequence: configuration.current_sequence,
        sequence_length: configuration.sequence_length,
        format_pattern: configuration.format_pattern,
        is_active: configuration.is_active,
      });
    } else {
      // Reset form for create mode
      setFormData({
        department_id: '',
        department_name: '',
        prefix: '', // Biarkan kosong, user akan isi sendiri
        current_sequence: 1,
        sequence_length: 3,
        format_pattern: 'PREFIX + SEQUENCE',
        is_active: false,
      });
    }
  }, [configuration, mode]);

  useEffect(() => {
    // Generate preview NIK tanpa separator
    if (formData.department_name && formData.prefix) {
      const preview = formData.prefix + 
                     formData.current_sequence.toString().padStart(formData.sequence_length, '0');
      setPreviewNIK(preview);
    } else {
      setPreviewNIK('');
    }
  }, [formData.department_name, formData.prefix, formData.current_sequence, formData.sequence_length]); // Spesifik dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department_name) {
      toast({
        title: 'Error',
        description: 'Pilih departemen terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.prefix || formData.prefix.trim() === '') {
      toast({
        title: 'Error',
        description: 'Prefix NIK tidak boleh kosong',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (mode === 'create') {
        await createConfiguration(formData);
      } else {
        await updateConfiguration(configuration.id, formData);
      }
      
      // Tutup dialog dan panggil callback success
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving configuration:', err);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan konfigurasi. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateNIK = async () => {
    if (!formData.department_name) {
      alert('Pilih departemen terlebih dahulu');
      return;
    }
    
    try {
      // Generate NIK dengan separator otomatis
      const nextSequence = formData.current_sequence + 1;
      const nik = formData.prefix + 
                  nextSequence.toString().padStart(formData.sequence_length, '0');
      setGeneratedNIK(nik);
    } catch (err) {
      console.error('Error generating NIK:', err);
    }
  };

  const handleTestFormat = async () => {
    if (!formData.department_name) {
      alert('Pilih departemen terlebih dahulu');
      return;
    }
    
    try {
      // Test format dengan separator otomatis
      const expectedPattern = new RegExp(`^${formData.prefix}[0-9]{${formData.sequence_length}}$`);
      const isValid = expectedPattern.test(previewNIK);
      setTestResult({
        valid: isValid,
        message: isValid ? 'Format NIK valid untuk departemen ini!' : 'Format NIK tidak valid untuk departemen ini.'
      });
    } catch (err) {
      setTestResult({
        valid: false,
        message: 'Error testing format'
      });
    }
  };

  const handleInputChange = (field: keyof DepartmentNIKConfigurationForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    const selectedDepartment = departments.find(dept => dept.id === departmentId);
    if (selectedDepartment) {
      setFormData(prev => ({
        ...prev,
        department_id: departmentId,
        department_name: selectedDepartment.nama,
        // Jangan reset prefix, biarkan user mengatur sendiri
        // prefix: 'EMP' // Hapus baris ini
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {mode === 'create' ? 'Buat Konfigurasi NIK Baru' : 'Edit Konfigurasi NIK'}
          </DialogTitle>
          <DialogDescription>
            Konfigurasi format dan pengaturan auto-generate NIK karyawan per departemen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department_id">Departemen</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={handleDepartmentChange}
                disabled={mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {dept.nama}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">Pilih departemen untuk konfigurasi NIK</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix NIK</Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) => handleInputChange('prefix', e.target.value.toUpperCase())}
                placeholder="Masukkan prefix (contoh: OPS, IT, HR)"
                maxLength={10}
              />
              <p className="text-sm text-gray-500">Contoh: IT, HR, FN</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sequence_length">Panjang Sequence</Label>
              <Input
                id="sequence_length"
                type="number"
                value={formData.sequence_length}
                onChange={(e) => handleInputChange('sequence_length', parseInt(e.target.value))}
                min={1}
                max={5}
              />
              <p className="text-sm text-gray-500">Jumlah digit angka (1-5)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_sequence">Sequence Saat Ini</Label>
              <Input
                id="current_sequence"
                type="number"
                value={formData.current_sequence}
                onChange={(e) => handleInputChange('current_sequence', parseInt(e.target.value))}
                min={1}
              />
              <p className="text-sm text-gray-500">Nomor urut berikutnya</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="format_pattern">Pattern Format</Label>
              <Input
                id="format_pattern"
                value={formData.format_pattern}
                onChange={(e) => handleInputChange('format_pattern', e.target.value)}
                placeholder="PREFIX + SEQUENCE"
              />
              <p className="text-sm text-gray-500">Gunakan PREFIX dan SEQUENCE sebagai placeholder</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Aktifkan konfigurasi ini</Label>
          </div>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview NIK</CardTitle>
              <CardDescription>Hasil format NIK berdasarkan konfigurasi departemen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg font-mono">
                  {previewNIK || 'Pilih departemen untuk preview'}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestFormat}
                  disabled={loading || !formData.department_name}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Format
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.valid ? "default" : "destructive"}>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateNIK}
                  disabled={loading || !formData.department_name}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate NIK Test
                </Button>
                {generatedNIK && (
                  <Badge variant="secondary" className="font-mono">
                    {generatedNIK}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Buat Konfigurasi' : 'Update Konfigurasi'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 