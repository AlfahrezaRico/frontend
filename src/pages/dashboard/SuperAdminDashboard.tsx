
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Settings, BarChart3, Database, Shield, LogOut, Upload, FileText, CheckCircle, XCircle, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import Papa from 'papaparse';
import { DepartemenDialog } from '@/components/TambahDepartemenDialog';
import { CacheManager } from '@/components/CacheManager';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvEmployees, setCsvEmployees] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvEmployees(results.data as any[]);
      },
    });
  };

  const handleCsvSubmit = async () => {
    if (!csvEmployees.length) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const url = API_URL ? `${API_URL}/api/employees/bulk` : '/api/employees/bulk';
      
      console.log('Uploading to:', url);
      console.log('Data count:', csvEmployees.length);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(csvEmployees),
      });
      // Selalu coba parse JSON agar bisa menampilkan daftar gagal dari backend
      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {
        // fallback ke text jika bukan JSON
        const errorText = await res.text();
        data = { error: errorText };
      }

      if (!res.ok) {
        console.error('Upload error payload:', data);
        // Jika backend mengirimkan results, gunakan langsung agar UI bisa tampilkan daftar yang gagal
        if (data && Array.isArray(data.results)) {
          setCsvResult({ ...data, success: false });
        } else {
          setCsvResult({ error: data?.error || `Upload failed (${res.status})`, success: false });
        }
        return;
      }

      setCsvResult(data);
      
      if (data.success) {
        setCsvEmployees([]);
        setCsvFile(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setCsvResult({ 
        error: err instanceof Error ? err.message : String(err),
        success: false 
      });
    }
  };

  const [userCount, setUserCount] = useState<number | null>(null);
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    fetch(`${API_URL}/api/users`).then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setUserCount(Array.isArray(data) ? data.length : 0);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">HRIS KSP Mekarsari</h1>
                <p className="text-sm text-gray-500">Super Admin Dashboard</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Dashboard Super Admin dengan button di kanan */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Super Admin</h1>
              <div className="text-gray-600 text-sm">Kelola seluruh sistem HRIS dengan akses penuh</div>
            </div>
            <button onClick={() => setCsvDialogOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-green-700 text-green-700 rounded hover:bg-green-50 transition">
              <Upload size={18} /> Upload CSV Karyawan
            </button>
          </div>

          {/* Summary + Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users */}
            <Card className="rounded-xl shadow-lg bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userCount ?? '-'}</div>
                <p className="text-xs text-muted-foreground">Akun terdaftar</p>
              </CardContent>
            </Card>

            {/* User Management */}
            {/* User Management */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white border border-gray-200">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>Kelola semua pengguna sistem, role, dan permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-lg shadow transition" onClick={() => navigate('/superadmin/users')}>
                  Kelola Users
                </Button>
              </CardContent>
            </Card>
            {/* Database Management */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white border border-gray-200">
              <CardHeader>
                <Database className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Backup, restore, dan maintenance database</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-lg shadow transition" onClick={() => navigate('/superadmin/database')}>
                  Database Tools
                </Button>
              </CardContent>
            </Card>
            {/* NIK Configuration */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white border border-gray-200">
              <CardHeader>
                <Hash className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Konfigurasi NIK</CardTitle>
                <CardDescription>Kelola format dan auto-generate NIK karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow transition" onClick={() => navigate('/superadmin/nik-configuration')}>
                  Kelola NIK
                </Button>
              </CardContent>
            </Card>
            {/* Tambah Departemen */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white border border-gray-200">
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Tambah Departemen</CardTitle>
                <CardDescription>Tambah dan kelola departemen perusahaan</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartemenDialog />
              </CardContent>
            </Card>
          </div>

          {/* Dialog Upload CSV Karyawan */}
                                  <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogContent className="w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload CSV Karyawan
                  </DialogTitle>
                  <DialogDescription>
                    Upload file CSV berisi data karyawan. Pastikan format sesuai dengan template yang diberikan.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="space-y-6 p-4 pb-8">
                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50">
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleCsvFileChange}
                        className="hidden"
                        id="csv-employee-file-input"
                      />
                      <label htmlFor="csv-employee-file-input" className="cursor-pointer block">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <div className="text-lg font-medium text-gray-700 mb-2">
                          {csvFile ? csvFile.name : 'Pilih file CSV'}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {csvFile ? 'File berhasil dipilih' : 'Klik untuk memilih file CSV atau drag & drop'}
                        </div>
                        <div className="text-xs text-gray-400 bg-white p-2 rounded border">
                          <strong>Format CSV:</strong> first_name, last_name, email, position, department, phone_number, nik, hire_date, date_of_birth, address, bank_account_number, bank_name
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                          <strong>💡 Tips:</strong> Field <code>department</code> harus sesuai dengan nama departemen yang sudah ada di sistem. Field <code>nik</code> opsional, akan di-generate otomatis jika kosong.
                        </div>
                      </label>
                    </div>
                  </div>

                                    {/* Preview Data */}
                  {csvEmployees.length > 0 && (
                    <div className="space-y-3">
                                              <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Preview Data ({csvEmployees.length} baris)</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline">{Object.keys(csvEmployees[0] || {}).length} field</Badge>
                            <Badge variant="secondary">{csvEmployees.length} data</Badge>
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              {Object.keys(csvEmployees[0] || {}).filter(key => 
                                ['first_name', 'last_name', 'email', 'position', 'department'].includes(key)
                              ).length} wajib
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              ← → Scroll untuk lihat semua {Object.keys(csvEmployees[0] || {}).length} kolom
                            </Badge>
                          </div>
                        </div>
                      
                      {/* Field Mapping Info */}
                      <div className="bg-gray-50 p-2 rounded-lg border">
                        <div className="text-xs font-medium mb-1">📋 Field Mapping:</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium">Wajib:</span>
                            <span className="text-gray-600">first_name, last_name, email, position, department</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="font-medium">Opsional:</span>
                            <span className="text-gray-600">phone_number, nik, hire_date, date_of_birth, address, bank_account_number, bank_name</span>
                          </div>
                        </div>
                      </div>
                        <div className="border rounded-lg bg-white">
                          <div className="max-h-64 overflow-x-auto overflow-y-auto">
                            <div className="min-w-max">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    {Object.keys(csvEmployees[0] || {}).map((key) => (
                                      <TableHead key={key} className="text-xs sticky top-0 bg-gray-50 font-medium whitespace-nowrap px-3 py-2 min-w-[140px]">
                                        {key}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {csvEmployees.slice(0, 5).map((row, i) => (
                                    <TableRow key={i} className="hover:bg-gray-50">
                                      {Object.keys(csvEmployees[0] || {}).map((key) => (
                                        <TableCell key={key} className="text-xs whitespace-nowrap px-3 py-2 min-w-[140px]">
                                          {row[key] || '-'}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {csvEmployees.length > 5 && (
                            <div className="text-center py-2 text-sm text-gray-500 border-t bg-gray-50">
                              Menampilkan 5 dari {csvEmployees.length} baris
                            </div>
                          )}
                          <div className="text-center py-2 text-sm text-blue-600 border-t bg-blue-50">
                            💡 Scroll ke kanan untuk melihat semua {Object.keys(csvEmployees[0] || {}).length} kolom data
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Submit Button */}
                  {csvEmployees.length > 0 && (
                    <div className="flex justify-center py-8 mt-6">
                      <Button 
                        onClick={handleCsvSubmit} 
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3"
                        size="lg"
                        disabled={!csvEmployees.length}
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload {csvEmployees.length} Data Karyawan
                      </Button>
                    </div>
                  )}

                  {/* Cache Manager */}
                  <div className="mt-8 border-t pt-8">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">🔧 System Tools</h3>
                      <p className="text-sm text-gray-500">Tools untuk mengatasi masalah sistem</p>
                    </div>
                    <div className="flex justify-center">
                      <CacheManager />
                    </div>
                  </div>

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

                          {/* Detailed Results: tampilkan hanya yang gagal */}
                          {csvResult.results && csvResult.results.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Data Gagal</h3>
                                <div className="flex gap-2">
                                  <Badge variant="destructive">
                                    {csvResult.results.filter((r: any) => r.error).length} Error
                                  </Badge>
                                </div>
                              </div>
                              <div className="border rounded-lg bg-white">
                                <div className="max-h-64 overflow-auto p-4 space-y-2">
                                  {csvResult.results.filter((r: any) => r.error).map((r: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {(r.emp?.first_name || r.emp?.last_name)
                                            ? `${r.emp?.first_name || ''} ${r.emp?.last_name || ''}`.trim()
                                            : (r.emp?.email || `Baris ${i + 1}`)}
                                        </div>
                                        <div className="text-xs text-red-600">
                                          {r.error}
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
              </div>

              <DialogFooter className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCsvDialogOpen(false);
                    setCsvEmployees([]);
                    setCsvFile(null);
                    setCsvResult(null);
                  }}
                >
                  Tutup
                </Button>
                {csvResult && !csvResult.success && (
                  <Button 
                    onClick={() => {
                      setCsvEmployees([]);
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
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
