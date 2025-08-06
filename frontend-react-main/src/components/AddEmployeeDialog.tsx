import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { UserPlus, Hash, Zap } from 'lucide-react';
import { useCreateEmployee } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { useAvailableUsers } from '@/hooks/useAvailableUsers';
import { useNIKConfiguration } from '@/hooks/useNIKConfiguration';
import { useNIKFormat } from '@/hooks/useNIKFormat';
import { useNIKValidation } from '@/hooks/useNIKValidation';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

const AddEmployeeDialog = ({ onEmployeeAdded }: { onEmployeeAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departemenList, setDepartemenList] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    position: '',
    departemen_id: '',
    hire_date: '',
    date_of_birth: '',
    address: '',
    bank_account_number: '',
    bank_name: '',
    nik: '',
  });

  const createEmployee = useCreateEmployee();
  const { toast } = useToast();
  const { availableUsers, loading: usersLoading } = useAvailableUsers(); // Hook untuk ambil daftar users yang belum memiliki karyawan
  const [selectedUserId, setSelectedUserId] = useState('');
  const { generateNextNIKForDepartment } = useNIKConfiguration();
  const { validateNIK, validating: nikValidating, clearValidationCache } = useNIKValidation();
  
  // Get department name for NIK format
  const selectedDepartemen = departemenList.find((dept: any) => dept.id === formData.departemen_id);
  const departmentName = selectedDepartemen?.nama || 'General';
  const { format: nikFormat, loading: formatLoading } = useNIKFormat(departmentName);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/departemen')
      .then(res => res.json())
      .then(setDepartemenList)
      .catch(() => setDepartemenList([]));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'bank_account_number') {
      // Hanya izinkan angka, max 17 digit
      if (!/^\d{0,17}$/.test(value)) return;
    }
    if (id === 'phone_number') {
      // Hanya izinkan angka, max 13 digit
      if (!/^\d{0,13}$/.test(value)) return;
    }
    if (id === 'position' || id === 'bank_name' || id === 'first_name' || id === 'last_name' || id === 'address') {
      setFormData((prev) => ({ ...prev, [id]: value.toUpperCase() }));
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi: semua field wajib diisi
    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone_number', 'position', 'departemen_id',
      'hire_date', 'date_of_birth', 'address', 'bank_account_number', 'bank_name', 'nik'
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast({
          title: 'Error',
          description: 'Semua field wajib diisi, tidak boleh ada yang kosong.',
          variant: 'destructive',
        });
        return;
      }
    }
    // Validasi: Nama Depan, Nama Belakang, Posisi, Nama Bank hanya huruf
    const onlyLetters = /^[A-Za-z\s]+$/;
    if (!onlyLetters.test(formData.first_name)) {
      toast({ title: 'Error', description: 'Nama Depan hanya boleh berisi huruf.', variant: 'destructive' });
      return;
    }
    if (!onlyLetters.test(formData.last_name)) {
      toast({ title: 'Error', description: 'Nama Belakang hanya boleh berisi huruf.', variant: 'destructive' });
      return;
    }
    if (!onlyLetters.test(formData.position)) {
      toast({ title: 'Error', description: 'Posisi hanya boleh berisi huruf.', variant: 'destructive' });
      return;
    }
    if (!onlyLetters.test(formData.bank_name)) {
      toast({ title: 'Error', description: 'Nama Bank hanya boleh berisi huruf.', variant: 'destructive' });
      return;
    }
         // Validasi: NIK format berdasarkan departemen
     const selectedDepartemen = departemenList.find((dept: any) => dept.id === formData.departemen_id);
     const departmentName = selectedDepartemen?.nama || 'General';
    
         // Validasi format NIK menggunakan hook dengan cache
     const validationResult = await validateNIK(formData.nik, departmentName);
     
     if (!validationResult.isValid) {
       // Jika validasi gagal, coba bersihkan cache dan validasi ulang
       console.log('Validation failed, clearing cache and retrying...');
       clearValidationCache(departmentName);
       
       // Validasi ulang tanpa cache
       const retryValidation = await validateNIK(formData.nik, departmentName);
       
       if (!retryValidation.isValid) {
         toast({ 
           title: 'Error', 
           description: `NIK harus sesuai format departemen ${departmentName} (contoh: ${retryValidation.expectedFormat}).`, 
           variant: 'destructive' 
         });
         return;
       }
     }
    // Validasi: bank_account_number dan phone_number hanya angka, 9-17 digit, dan trim
    const bankAcc = formData.bank_account_number.trim();
    const phoneNum = formData.phone_number.trim();
    if (!/^[0-9]{9,17}$/.test(bankAcc)) {
      toast({
        title: 'Error',
        description: 'Nomor rekening harus angka, minimal 9 dan maksimal 17 digit',
        variant: 'destructive',
      });
      return;
    }
    if (!/^[0-9]{10,13}$/.test(phoneNum)) {
      toast({
        title: 'Error',
        description: 'Nomor telepon harus angka, minimal 10 dan maksimal 13 digit',
        variant: 'destructive',
      });
      return;
    }
    // Validasi: email format
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Format email tidak valid',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'User harus dipilih',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // HRD hanya menambah data karyawan, bukan user Auth
      await createEmployee.mutateAsync({
        ...formData,
        email: formData.email, // sudah otomatis dari user
        user_id: selectedUserId, // PASTIKAN ini adalah user.id dari tabel users
        departemen_id: formData.departemen_id, // PATCH: kirim departemen_id
        bank_account_number: bankAcc, // PATCH: kirim sebagai string
        phone_number: phoneNum, // PATCH: kirim sebagai string
        nik: formData.nik, // NIK karyawan
        // hire_date, date_of_birth, address tetap
        hire_date: formData.hire_date ? new Date(formData.hire_date).toISOString() : null,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
        address: formData.address,
      });
      toast({
        title: 'Berhasil',
        description: 'Karyawan baru berhasil ditambahkan.',
        variant: 'default',
      });
      onEmployeeAdded(); // Refresh data
      setOpen(false); // Tutup dialog
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        position: '',
        departemen_id: '',
        hire_date: '',
        date_of_birth: '',
        address: '',
        bank_account_number: '',
        bank_name: '',
        nik: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan karyawan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      position: '',
      departemen_id: '',
      hire_date: '',
      date_of_birth: '',
      address: '',
      bank_account_number: '',
      bank_name: '',
      nik: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Karyawan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Karyawan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nama Depan</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nama Belakang</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          {/* Pindahkan dropdown user ke atas */}
          <div>
            <Label htmlFor="user_id">Pilih User (Email)</Label>
            <Select value={selectedUserId} onValueChange={val => {
              setSelectedUserId(val);
              const user = availableUsers.find(u => u.id === val);
              setFormData(prev => ({ ...prev, email: user ? user.email : '', nik: '' }));
            }}>
              <SelectTrigger id="user_id">
                <SelectValue placeholder={usersLoading ? "Loading..." : "Pilih user yang belum memiliki data karyawan"} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers && availableUsers.length > 0 ? (
                  availableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {usersLoading ? "Loading..." : "Tidak ada user yang tersedia"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Field email setelahnya, otomatis terisi dan readOnly */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              readOnly
              disabled
              required
            />
          </div>
          
                     {/* Field NIK dengan auto-generate */}
           <div>
             <Label htmlFor="nik">NIK (Nomor Induk Karyawan)</Label>
             <div className="flex gap-2">
               <Input
                 id="nik"
                 value={formData.nik}
                 onChange={handleInputChange}
                 placeholder="Auto-generate atau input manual"
                 required
                 className="flex-1"
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
                     setFormData(prev => ({ ...prev, nik }));
                   } catch (error) {
                     toast({
                       title: 'Error',
                       description: 'Gagal generate NIK. Pastikan konfigurasi NIK sudah diatur.',
                       variant: 'destructive',
                     });
                   }
                 }}
                 className="flex items-center gap-2"
               >
                 <Zap className="h-4 w-4" />
                 Auto
               </Button>
             </div>
                           <p className="text-xs text-gray-500 mt-1">
                Format: {formatLoading ? 'Loading...' : nikFormat || '2-3 huruf + 3 angka (contoh: EMP001)'}
              </p>
           </div>
          
          <div>
            <Label htmlFor="phone_number">Nomor Telepon</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Posisi</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="departemen_id">Departemen</Label>
              <Select value={formData.departemen_id} onValueChange={val => {
                setFormData({ ...formData, departemen_id: val, nik: '' });
                // Auto-generate NIK for new department
                const selectedDepartemen = departemenList.find((dept: any) => dept.id === val);
                const departmentName = selectedDepartemen?.nama || 'General';
                generateNextNIKForDepartment(departmentName).then(nik => {
                  setFormData(prev => ({ ...prev, nik }));
                }).catch(() => {
                  // Ignore error, user can manually input
                });
              }}>
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
              <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_account_number">Nomor Rekening</Label>
              <Input
                id="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Nama Bank</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export { AddEmployeeDialog };
