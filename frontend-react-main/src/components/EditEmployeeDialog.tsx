import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Edit, Zap } from 'lucide-react';
import { useUpdateEmployee, Employee } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { useNIKConfiguration } from '@/hooks/useNIKConfiguration';

interface EditEmployeeDialogProps {
  employee: Employee;
}

export const EditEmployeeDialog = ({ employee }: EditEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [departemenList, setDepartemenList] = useState([]);
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/departemen')
      .then(res => res.json())
      .then(setDepartemenList)
      .catch(() => setDepartemenList([]));
  }, []);
  const [formData, setFormData] = useState({
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    phone_number: employee.phone_number || '',
    position: employee.position || '',
    hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
    date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth).toISOString().split('T')[0] : '',
    address: employee.address || '',
    bank_account_number: employee.bank_account_number || '',
    bank_name: employee.bank_name || '',
    departemen_id: employee.departemen_id || '',
    nik: employee.nik || '',
  });

  const updateEmployee = useUpdateEmployee();
  const { toast } = useToast();
  const { generateNextNIKForDepartment } = useNIKConfiguration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        position: formData.position,
        hire_date: formData.hire_date,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        bank_account_number: formData.bank_account_number,
        bank_name: formData.bank_name,
        departemen_id: formData.departemen_id,
        nik: formData.nik,
      };
      await updateEmployee.mutateAsync({
        id: employee.id,
        ...updateData,
      });
      
      toast({
        title: 'Berhasil',
        description: 'Data karyawan berhasil diperbarui',
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data karyawan',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Karyawan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nama Depan</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nama Belakang</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone_number">Nomor Telepon</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Posisi</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="departemen_id">Departemen</Label>
              <Select value={formData.departemen_id} onValueChange={val => setFormData({ ...formData, departemen_id: val })}>
                <SelectTrigger id="departemen_id">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departemenList.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hire_date">Tanggal Bergabung</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nik">NIK</Label>
              <div className="flex gap-2">
                <Input
                  id="nik"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="Kosongkan untuk generate otomatis"
                />
                                 <Button
                   type="button"
                   variant="outline"
                   onClick={async () => {
                     try {
                       // Get department name from selected departemen_id
                       const selectedDepartemen = departemenList.find((dept: any) => dept.id === formData.departemen_id);
                       const departmentName = selectedDepartemen?.nama || 'General';
                       const nik = await generateNextNIKForDepartment(departmentName);
                       setFormData({ ...formData, nik });
                       toast({
                         title: 'Berhasil',
                         description: 'NIK berhasil di-generate',
                       });
                     } catch (error) {
                       toast({
                         title: 'Error',
                         description: 'Gagal generate NIK. Pastikan konfigurasi NIK sudah diatur.',
                         variant: 'destructive',
                       });
                     }
                   }}
                   disabled={!formData.departemen_id}
                   className="flex items-center gap-2"
                 >
                   <Zap className="h-4 w-4" />
                   Auto
                 </Button>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Nama Bank</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="bank_account_number">Nomor Rekening</Label>
              <Input
                id="bank_account_number"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                placeholder="Minimal 9 digit"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateEmployee.isPending}>
              {updateEmployee.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
