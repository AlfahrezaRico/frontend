import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Edit, Trash2, ArrowLeft, AlertCircle, CheckCircle, XCircle, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from '@/hooks/AuthProvider';
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from 'papaparse';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;
const API_URL = import.meta.env.VITE_API_URL || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/users`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data || []);
    } else {
      setUsers([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  return { users, loading, refetch: fetchUsers };
};

const AddUserDialog = ({ onUserAdded }: { onUserAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.id]: e.target.value }));
  };

  const handleRoleChange = (value: string) => {
    setForm(f => ({ ...f, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_SECRET) {
      toast({ 
        title: 'Konfigurasi error', 
        description: 'Admin secret tidak terkonfigurasi', 
        variant: 'destructive' 
      });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        username: form.username,
        role: form.role,
      };
      const res = await fetch(`${API_URL}/api/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ 
          title: 'Gagal menambah user', 
          description: data.error || data.details || 'Gagal menambah user', 
          variant: 'destructive' 
        });
        console.error('Admin create user error:', data);
        return;
      }
      toast({ title: 'User berhasil ditambahkan' });
      setOpen(false);
      setForm({ username: '', email: '', password: '', role: '' });
      onUserAdded();
    } catch (err) {
      toast({ 
        title: 'Gagal menambah user', 
        description: err instanceof Error ? err.message : 'Terjadi kesalahan', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={form.username} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={form.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="hrd">HRD</SelectItem>
                <SelectItem value="karyawan">Karyawan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Tambahkan hook untuk update dan delete user
const useUpdateUser = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const updateUser = async (id: string, data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal update user');
      toast({ title: 'Berhasil', description: 'User berhasil diupdate' });
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal update user', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { updateUser, loading };
};

const useDeleteUser = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal hapus user');
      toast({ title: 'Berhasil', description: 'User berhasil dihapus' });
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal hapus user', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { deleteUser, loading };
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { users, loading, refetch } = useUsers();
  const { updateUser, loading: updating } = useUpdateUser();
  const { deleteUser, loading: deleting } = useDeleteUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '', password: '' });
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvUsers, setCsvUsers] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  // Filter users berdasarkan search term
  const filteredUsers = users.filter((user: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      user.status?.toLowerCase().includes(searchLower)
    );
  });

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  // Reset page ketika search berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvUsers(results.data as any[]);
      },
    });
  };

  const handleCsvSubmit = async () => {
    if (!csvUsers.length) return;
    try {
      const url = BACKEND_URL ? `${BACKEND_URL}/api/users/bulk` : '/api/users/bulk';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(csvUsers),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: 'Gagal parse response dari server.' };
      }
      console.log('CSV BULK SUBMIT RESPONSE:', res, data);
      if (!res.ok) {
        setCsvResult({ error: data.error || 'Gagal upload user', results: data.results, url });
      } else {
        setCsvResult({ ...data, url });
      }
    } catch (err) {
      console.log('CSV BULK SUBMIT ERROR:', err, 'URL:', BACKEND_URL ? `${BACKEND_URL}/api/users/bulk` : '/api/users/bulk', 'Payload:', csvUsers);
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'Failed to fetch') {
        errorMsg += '. Cek koneksi ke backend, CORS, atau URL backend.';
      }
      setCsvResult({ error: errorMsg, url: BACKEND_URL ? `${BACKEND_URL}/api/users/bulk` : '/api/users/bulk' });
    }
  };

  const handleUploadCsvUsers = async () => {
    // TODO: Kirim csvUsers ke backend endpoint untuk tambah user masal
    // Contoh: await fetch('/api/users/bulk', { method: 'POST', body: JSON.stringify(csvUsers), ... })
    setCsvDialogOpen(false);
    setCsvUsers([]);
    setCsvFile(null);
  };

  const openEditDialog = (user: any) => {
    setEditUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, password: '' });
    setEditDialogOpen(true);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(f => ({ ...f, [e.target.id]: e.target.value }));
  };
  const handleEditRoleChange = (value: string) => {
    setEditForm(f => ({ ...f, role: value }));
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    // Kirim password hanya jika diisi
    const payload = { ...editForm };
    if (!payload.password) delete payload.password;
    const ok = await updateUser(editUser.id, payload);
    if (ok) {
      setEditDialogOpen(false);
      setEditUser(null);
      refetch();
    }
  };
  const openDeleteDialog = (id: string) => {
    setDeleteUserId(id);
    setDeleteDialogOpen(true);
  };
  const handleDelete = async () => {
    if (!deleteUserId) return;
    const ok = await deleteUser(deleteUserId);
    if (ok) {
      setDeleteDialogOpen(false);
      setDeleteUserId(null);
      refetch();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard/superadmin')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Kelola pengguna sistem</p>
              </div>
            </div>
            <AddUserDialog onUserAdded={refetch} />
            {/* Tambah Button Upload CSV */}
            <Button className="ml-2" variant="outline" onClick={() => setCsvDialogOpen(true)}>
              Upload CSV
            </Button>
            {/* Dialog Upload CSV */}
            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload CSV Karyawan
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
                  <div className="space-y-6 p-1">
                    {/* File Upload Section */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input 
                          type="file" 
                          accept=".csv" 
                          onChange={handleCsvFileChange}
                          className="hidden"
                          id="csv-file-input"
                        />
                        <label htmlFor="csv-file-input" className="cursor-pointer">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <div className="text-lg font-medium text-gray-700 mb-2">
                            {csvFile ? csvFile.name : 'Pilih file CSV'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {csvFile ? 'File berhasil dipilih' : 'Klik untuk memilih file CSV'}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview Data */}
                    {csvUsers.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Preview Data ({csvUsers.length} baris)</h3>
                          <Badge variant="outline">{Object.keys(csvUsers[0] || {}).length} kolom</Badge>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="max-h-48 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(csvUsers[0] || {}).map((key) => (
                                    <TableHead key={key} className="text-xs sticky top-0 bg-white">{key}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvUsers.slice(0, 5).map((row, i) => (
                                  <TableRow key={i}>
                                    {Object.keys(csvUsers[0] || {}).map((key) => (
                                      <TableCell key={key} className="text-xs">{row[key] || '-'}</TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {csvUsers.length > 5 && (
                            <div className="text-center py-2 text-sm text-gray-500 border-t">
                              Menampilkan 5 dari {csvUsers.length} baris
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    {csvUsers.length > 0 && (
                      <div className="flex justify-center">
                        <Button 
                          onClick={handleCsvSubmit} 
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {csvUsers.length} Data Karyawan
                        </Button>
                      </div>
                    )}

                    {/* Results Section */}
                    {csvResult && (
                      <div className="space-y-4">
                        {csvResult.success ? (
                          <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              <strong>Berhasil!</strong> Semua data karyawan berhasil diupload.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-4">
                            {/* General Error */}
                            {csvResult.error && (
                              <Alert className="border-red-200 bg-red-50">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  <strong>Error:</strong> {csvResult.error}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Detailed Results */}
                            {csvResult.results && csvResult.results.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-medium">Detail Hasil Upload</h3>
                                  <div className="flex gap-2">
                                    <Badge variant="destructive">
                                      {csvResult.results.filter((r: any) => r.error).length} Error
                                    </Badge>
                                    <Badge variant="default">
                                      {csvResult.results.filter((r: any) => !r.error).length} Sukses
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="border rounded-lg">
                                  <div className="max-h-64 overflow-auto p-4 space-y-2">
                                    {csvResult.results.map((r: any, i: number) => (
                                      <div 
                                        key={i} 
                                        className={`flex items-center gap-3 p-3 rounded-lg ${
                                          r.error 
                                            ? 'bg-red-50 border border-red-200' 
                                            : 'bg-green-50 border border-green-200'
                                        }`}
                                      >
                                        {r.error ? (
                                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">
                                            {r.user?.email || `Baris ${i + 1}`}
                                          </div>
                                          <div className={`text-xs ${
                                            r.error ? 'text-red-600' : 'text-green-600'
                                          }`}>
                                            {r.error || 'Berhasil ditambahkan'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <DialogFooter className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCsvDialogOpen(false);
                      setCsvUsers([]);
                      setCsvFile(null);
                      setCsvResult(null);
                    }}
                  >
                    Tutup
                  </Button>
                  {csvResult && !csvResult.success && (
                    <Button 
                      onClick={() => {
                        setCsvUsers([]);
                        setCsvFile(null);
                        setCsvResult(null);
                      }}
                      variant="outline"
                    >
                      Upload Ulang
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daftar Pengguna</CardTitle>
                  <CardDescription>Kelola akun pengguna dan role mereka</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Cari pengguna..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Search Results Info */}
              {searchTerm && (
                <div className="mb-4 text-sm text-gray-600">
                  Menampilkan {filteredUsers.length} dari {users.length} pengguna untuk "{searchTerm}"
                </div>
              )}

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Super Admin' ? 'destructive' : user.role === 'HRD' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openDeleteDialog(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-4 gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt; Sebelumnya</button>
                <span>Halaman {page} dari {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Selanjutnya &gt;</button>
              </div>
              {/* Dialog Edit User */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={editForm.username} onChange={handleEditChange} required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={editForm.email} onChange={handleEditChange} required />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={editForm.role} onValueChange={handleEditRoleChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                          <SelectItem value="hrd">HRD</SelectItem>
                          <SelectItem value="karyawan">Karyawan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="password">Password Baru (opsional)</Label>
                      <Input id="password" type="password" value={editForm.password} onChange={handleEditChange} placeholder="Kosongkan jika tidak ingin ganti password" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={updating}>{updating ? 'Menyimpan...' : 'Simpan'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Dialog Konfirmasi Hapus User */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Konfirmasi Hapus User</DialogTitle>
                  </DialogHeader>
                  <div>Apakah Anda yakin ingin menghapus user ini?</div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;