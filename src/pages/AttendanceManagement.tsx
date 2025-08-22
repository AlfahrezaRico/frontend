
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Determine visibility for HRD tools (bulk upload, template)
  const isHRDLikeRole = (role: string | null) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return ['hrd', 'admin', 'superadmin', 'super_admin', 'super-admin'].includes(r);
  };
  const onHRDRoute = location.pathname?.toLowerCase().includes('/dashboard/hrd');
  const canSeeHRDTools = isHRDLikeRole(userRole) || onHRDRoute;

  // Ambil employee_id user login
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (user?.id) {
        const res = await fetch(`${API_URL}/api/employees?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployeeId(data?.id || null);
        }
      }
    };
    fetchEmployeeId();
  }, [user]);

  // Ambil role user login
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        const res = await fetch(`${API_URL}/api/user-role?user_id=${user.id}`);
        const data = await res.json();
        setUserRole(data?.role || null);
      }
    };
    fetchUserRole();
  }, [user]);

  // Bulk upload functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!validTypes.includes(file.type) && !hasValidExtension) {
        toast({
          title: "Error",
          description: "File harus berupa Excel (.xlsx, .xls) atau CSV (.csv)",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file terlalu besar. Maksimal 10MB",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      // Validate file is not empty
      if (file.size === 0) {
        toast({
          title: "Error",
          description: "File tidak boleh kosong",
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }
      
      setUploadFile(file);
      toast({
        title: "File Berhasil Dipilih",
        description: `${file.name} siap untuk diupload`,
        variant: "default"
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (!selectedMonth) {
      toast({
        title: "Error",
        description: "Pilih bulan terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('month', selectedMonth);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API_URL}/api/attendance/bulk-upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal upload file');
      }

      const result = await response.json();
      
      // Show detailed results
      if (result.uploaded > 0) {
        toast({
          title: "Upload Berhasil",
          description: `Berhasil upload ${result.uploaded} dari ${result.total} record absensi.`,
          variant: "default"
        });
      }
      
      if (result.errors && result.errors.length > 0) {
        // Show errors in a more detailed way
        const errorMessage = `Upload selesai dengan ${result.errors.length} error:\n` + 
          result.errors.slice(0, 3).map((err: any) => 
            `Baris ${err.row}: ${err.error}`
          ).join('\n') + 
          (result.errors.length > 3 ? `\n...dan ${result.errors.length - 3} error lainnya` : '');
        
        toast({
          title: "Upload Selesai dengan Error",
          description: errorMessage,
          variant: "destructive"
        });
      }

      // Reset form and close dialog
      closeDialog();
      
      // Refresh attendance data after successful upload
      await fetchAttendanceData();
      
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: "Error",
        description: error.message || 'Gagal upload file',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create comprehensive template data with sample records
    const templateData = [
      ['nik', 'date', 'check_in_time', 'check_out_time', 'notes'],
      ['OPR00001', '2025-01-15', '08:00:00', '17:00:00', 'Hadir tepat waktu'],
      ['OPR00001', '2025-01-16', '08:05:00', '17:00:00', 'Akan dihitung LATE otomatis'],
      ['OPR00001', '2025-01-17', '12:00:00', '17:00:00', 'Akan dihitung HALF_DAY otomatis']
    ];

    // Create CSV content with proper formatting
    const csvContent = templateData.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or newline
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    // Add comprehensive instructions at the top
    const instructions = [
      'TEMPLATE BULK UPLOAD ABSENSI',
      '================================',
      '',
      'INSTRUKSI PENGISIAN:',
      '1. nik: Nomor Induk Karyawan (wajib diisi) - sesuai NIK di sistem',
      '2. date: Tanggal absensi dalam format YYYY-MM-DD (wajib diisi)',
      '3. check_in_time: Jam masuk dalam format HH:MM:SS (wajib diisi)',
      '4. check_out_time: Jam keluar dalam format HH:MM:SS (wajib diisi)',
      '5. notes: Catatan tambahan (opsional)',
      '',
      'STATUS Dihitung Otomatis oleh Sistem:',
      '- check_in_time > 08:00:00  -> LATE',
      '- check_in_time = 12:00:00  -> HALF_DAY',
      '- check_in_time <= 08:00:00 -> PRESENT',
      '',
      'CATATAN PENTING:',
      '- Hapus baris contoh sebelum upload',
      '- Pastikan NIK valid dan ada di sistem',
      '- Format tanggal harus YYYY-MM-DD',
      '- Format waktu harus HH:MM:SS',
      '- Data yang sudah ada akan diupdate jika tanggal sama',
      '- File akan diproses per baris dengan validasi lengkap',
      '',
      'CONTOH DATA:',
      csvContent
    ].join('\n');

    const blob = new Blob([instructions], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_absensi_${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: `Template absensi untuk bulan ${selectedMonth} berhasil didownload`,
      variant: "default"
    });
  };

  // Jangan panggil hook sebelum employeeId siap jika karyawan
  const shouldFetch = !(location.state?.onlyMe && !employeeId);
  // GANTI: data attendance menjadi state lokal kosong agar tidak error render
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    if (!shouldFetch) return;
    
    setIsLoading(true);
    try {
      let url = `${API_URL}/api/attendance-records`;
      
      if (location.state?.onlyMe && employeeId) {
        url += `?employee_id=${employeeId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance data on component mount and when dependencies change
  useEffect(() => {
    fetchAttendanceData();
  }, [employeeId, selectedMonth, shouldFetch]);

  // Jika karyawan dan employeeId belum siap, tampilkan loading
  if (location.state?.onlyMe && !employeeId) {
    return <div className="min-h-screen flex items-center justify-center">Loading data absensi...</div>;
  }

  // Filter dan pagination
  const filteredRecords = attendanceRecords.filter(rec => {
    const q = search.toLowerCase();
    return (
      rec.employee?.first_name?.toLowerCase().includes(q) ||
      rec.employee?.last_name?.toLowerCase().includes(q) ||
      rec.employee?.email?.toLowerCase().includes(q) ||
      rec.employee?.department?.toLowerCase().includes(q) ||
      rec.employee?.position?.toLowerCase().includes(q) ||
      rec.status?.toLowerCase().includes(q)
    );
  });
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // Filter data jika karyawan dan state.onlyMe true
  const match = (rec: any) => {
    let match = true;
    if (location.state?.onlyMe && employeeId) {
      match = rec.employee_id === employeeId;
    }
    // Filter bulan
    if (selectedMonth) {
      const recMonth = new Date(rec.date).toISOString().slice(0, 7);
      match = match && recMonth === selectedMonth;
    }
    return match;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Hadir</span>
        );
      case "ABSENT":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Tidak Hadir</span>
        );
      case "LATE":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Terlambat</span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
        );
    }
  };

  // Function to clear file input
  const clearFileInput = () => {
    setUploadFile(null);
    setUploadProgress(0);
    // Clear the file input element
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Function to close dialog and clear data
  const closeDialog = () => {
    setBulkUploadOpen(false);
    clearFileInput();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(userRole === "karyawan" ? "/dashboard/karyawan" : "/dashboard/hrd")
                }
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Data Absensi</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Riwayat Absensi
              </CardTitle>
              <CardDescription>
                Monitor kehadiran dan jam kerja semua karyawan
              </CardDescription>
              <div className="mt-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="font-medium">Filter Bulan:</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                
                {/* Bulk Upload Section - Show for HRD-like roles or on HRD route */}
                {canSeeHRDTools && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setBulkUploadOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                    <Button
                      onClick={fetchAttendanceData}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                      disabled={isLoading}
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div>
                  {/* Search Bar */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="border px-2 py-1 rounded w-64"
                      placeholder="Cari nama, email, departemen, posisi, status..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                    />
                    <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
                  </div>
                  {/* Tabel Absensi */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {pagedRecords.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : ''}
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          {record.check_in_time || '-'}
                        </TableCell>
                        <TableCell>
                          {record.check_out_time || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Bulk Upload Absensi
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Petunjuk Upload:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Format file: Excel (.xlsx, .xls) atau CSV (.csv)</li>
                <li>• Kolom wajib: employee_id, date</li>
                <li>• Kolom opsional: check_in_time, check_out_time, status, notes</li>
                <li>• Format tanggal: YYYY-MM-DD (contoh: 2025-01-15)</li>
                <li>• Format waktu: HH:MM:SS (contoh: 08:00:00)</li>
                <li>• Status yang valid: PRESENT, ABSENT, LATE, HALF_DAY</li>
              </ul>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">Pilih File Excel/CSV</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maksimal ukuran file: 10MB. Kolom wajib: nik, date, check_in_time, check_out_time. Notes optional. Status dihitung otomatis.
              </p>
            </div>

            {/* File Info */}
            {uploadFile && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      File terpilih: <strong>{uploadFile.name}</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Ukuran: {(uploadFile.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-green-600">
                      Tipe: {uploadFile.type || 'Unknown'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                {uploadProgress < 100 && (
                  <p className="text-xs text-gray-500 text-center">
                    Mohon tunggu, sedang memproses file...
                  </p>
                )}
              </div>
            )}

            {/* Tips */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Tips:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Download template terlebih dahulu untuk format yang benar</li>
                <li>• Pastikan employee_id ada di sistem</li>
                <li>• Data yang sudah ada akan diupdate jika tanggal sama</li>
                <li>• File akan diproses per baris dengan validasi lengkap</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={uploading}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!uploadFile || uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceManagement;
