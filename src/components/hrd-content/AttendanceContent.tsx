import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, CheckCircle, XCircle, Calendar, Upload, Download, FileSpreadsheet, RefreshCw, Eye, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTimeToStringWithFix } from "@/utils/timeFormatter";

// Helper function to format working time from minutes to HH:MM format
const formatWorkingTime = (minutes: number | null): string => {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return '-';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to get status badge with colors
const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PRESENT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
          {status}
        </span>
      );
    case 'LATE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <div className="w-2 h-2 bg-orange-400 rounded-full mr-1.5"></div>
          {status}
        </span>
      );
    case 'HALF_DAY':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></div>
          {status}
        </span>
      );
    case 'ABSENT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <div className="w-2 h-2 bg-red-400 rounded-full mr-1.5"></div>
          {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <div className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></div>
          {status || 'UNKNOWN'}
        </span>
      );
  }
};

export const AttendanceContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL || '';
  const selectedMonthDefault = new Date().toISOString().slice(0, 7);

  // New: table state for attendance
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(selectedMonthDefault);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const fetchAttendance = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch(`${API_URL}/api/attendance-records`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch attendance error:', e);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const filtered = useMemo(() => {
    const month = selectedMonth;
    return attendanceRecords
      .filter((rec: any) => {
        if (!month) return true;
        const recMonth = new Date(rec.date).toISOString().slice(0, 7);
        return recMonth === month;
      })
      .filter((rec: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const name = rec.employee ? `${rec.employee.first_name ?? ''} ${rec.employee.last_name ?? ''}`.toLowerCase() : '';
        return name.includes(q) || (rec.status || '').toLowerCase().includes(q);
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, selectedMonth, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openDetail = (rec: any) => {
    setDetailRecord(rec);
    setDetailOpen(true);
  };
  const openEdit = (rec: any) => {
    setDetailRecord(rec);
    setEditNotes(rec.notes || "");
    setEditOpen(true);
  };
  const saveNotes = async () => {
    if (!detailRecord) return;
    try {
      const res = await fetch(`${API_URL}/api/attendance-records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: detailRecord.id, notes: editNotes })
      });
      if (!res.ok) throw new Error('Gagal menyimpan catatan');
      toast({ title: 'Tersimpan', description: 'Catatan berhasil diperbarui' });
      setEditOpen(false);
      await fetchAttendance();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Gagal menyimpan catatan', variant: 'destructive' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!validTypes.includes(file.type) && !hasValidExtension) {
        toast({ title: 'Error', description: 'File harus berupa Excel (.xlsx, .xls) atau CSV (.csv)', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Ukuran file terlalu besar. Maksimal 10MB', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      if (file.size === 0) {
        toast({ title: 'Error', description: 'File tidak boleh kosong', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setUploadFile(file);
      toast({ title: 'File Berhasil Dipilih', description: `${file.name} siap untuk diupload` });
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({ title: 'Error', description: 'Pilih file terlebih dahulu', variant: 'destructive' });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('month', selectedMonth);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 200);
      const response = await fetch(`${API_URL}/api/attendance/bulk-upload`, { method: 'POST', body: formData });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal upload file');
      }
      const result = await response.json();
      if (result.uploaded > 0) {
        toast({ title: 'Upload Berhasil', description: `Berhasil upload ${result.uploaded} dari ${result.total} record absensi.` });
      }
      if (result.errors && result.errors.length > 0) {
        const msg = `Upload selesai dengan ${result.errors.length} error:\n` +
          result.errors.slice(0, 3).map((err: any) => `Baris ${err.row}: ${err.error}`).join('\n') +
          (result.errors.length > 3 ? `\n...dan ${result.errors.length - 3} error lainnya` : '');
        toast({ title: 'Upload Selesai dengan Error', description: msg, variant: 'destructive' });
      }
      setBulkUploadOpen(false);
      setUploadFile(null);
      setUploadProgress(0);
      // refresh table after upload
      await fetchAttendance();
    } catch (error: any) {
      setUploadProgress(0);
      toast({ title: 'Error', description: error.message || 'Gagal upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['nik', 'date', 'check_in_time', 'check_out_time', 'notes'],
      ['OPR00001', '2025-01-15', '08:00:00', '17:00:00', 'Hadir tepat waktu'],
      ['OPR00001', '2025-01-16', '08:05:00', '17:00:00', 'Akan dihitung LATE otomatis'],
      ['OPR00001', '2025-01-17', '12:00:00', '17:00:00', 'Akan dihitung HALF_DAY otomatis']
    ];
    const csvContent = templateData.map(row => row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/\"/g, '""')}"`;
      }
      return cell;
    }).join(',')).join('\n');
    const instructions = [
      'TEMPLATE BULK UPLOAD ABSENSI',
      '================================',
      '',
      'Kolom wajib: nik, date, check_in_time, check_out_time (notes optional)',
      'Status tidak perlu diisi. Sistem akan menghitung otomatis:',
      '- Jika check_in_time > 08:00:00 maka status LATE',
      '- Jika check_in_time = 12:00:00 maka status HALF_DAY',
      '- Jika <= 08:00:00 maka status PRESENT',
      '',
      'Jam Kerja (working_time) akan dihitung otomatis dari selisih check_out_time - check_in_time',
      'dalam satuan menit dan ditampilkan dalam format HH:MM di sistem.',
      '',
      csvContent
    ].join('\n');
    const blob = new Blob([instructions], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_absensi.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <div>
           <h2 className="text-3xl font-bold text-gray-900">
             Data Absensi
           </h2>
           <p className="text-gray-600 mt-2 text-lg">Monitor kehadiran dan jam kerja karyawan</p>
         </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-6">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <label className="text-sm font-medium text-gray-700">Filter Bulan:</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }} 
                className="border-0 bg-transparent text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" 
              />
            </div>
            <div className="relative">
              <Input 
                placeholder="Cari nama/status" 
                value={search} 
                onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} 
                className="w-64 pl-10 pr-4 py-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm" 
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setBulkUploadOpen(true)} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={downloadTemplate} 
            variant="outline" 
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            onClick={fetchAttendance} 
            variant="outline" 
            className="border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

             {/* Table */}
       <Card className="shadow-sm border border-gray-200">
         <CardHeader className="bg-gray-50 border-b border-gray-200">
           <CardTitle className="text-xl font-bold text-gray-900">Data Absensi Karyawan</CardTitle>
           <CardDescription className="text-gray-600">Daftar kehadiran karyawan</CardDescription>
         </CardHeader>
        <CardContent>
          {/* Filter bar (mobile) */}
          <div className="md:hidden mb-3 flex items-center gap-2">
            <input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }} className="border rounded px-2 py-1" />
            <Input placeholder="Cari nama/status" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} />
          </div>
          {loadingTable ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border border-gray-200 rounded-lg overflow-hidden">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jam Masuk</TableHead>
                    <TableHead>Jam Pulang</TableHead>
                    <TableHead>Jam Kerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((rec: any, index: number) => (
                    <TableRow 
                      key={rec.id} 
                      className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {rec.employee ? `${rec.employee.first_name ?? ''} ${rec.employee.last_name ?? ''}`.trim() : ''}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(rec.date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600 font-medium">
                        {formatTimeToStringWithFix(rec.check_in_time)}
                      </TableCell>
                      <TableCell className="font-mono text-purple-600 font-medium">
                        {formatTimeToStringWithFix(rec.check_out_time)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{formatWorkingTime(rec.working_time)}</TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                      <TableCell className="text-gray-600">{rec.notes || '-'}</TableCell>
                      <TableCell className="text-right pr-6 flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => openDetail(rec)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {rec.status === 'LATE' && (!rec.notes || String(rec.notes).trim() === '') && (
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="w-9 h-9 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all duration-200" 
                            onClick={() => openEdit(rec)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data absensi</p>
                </div>
              )}
              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 font-medium">
                    Menampilkan <span className="text-blue-600 font-semibold">{(page - 1) * pageSize + 1}</span> - <span className="text-blue-600 font-semibold">{Math.min(page * pageSize, filtered.length)}</span> dari <span className="text-blue-600 font-semibold">{filtered.length}</span> data
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      disabled={page === 1} 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                      Halaman <span className="text-blue-600">{page}</span> dari <span className="text-blue-600">{totalPages}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      disabled={page === totalPages} 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detail Absensi</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="rounded-lg bg-slate-50 border p-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{detailRecord.employee ? `${detailRecord.employee.first_name ?? ''} ${detailRecord.employee.last_name ?? ''}`.trim() : '-'}</div>
                  <div className="text-sm text-slate-600">NIK {detailRecord.employee?.nik ?? '-'}</div>
                </div>
                <div className="flex gap-2">
                  {detailRecord.employee?.position && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{detailRecord.employee.position}</span>
                  )}
                  {detailRecord.status && (
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-200 text-slate-700">{detailRecord.status}</span>
                  )}
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Tanggal</div>
                  <div className="font-medium">{new Date(detailRecord.date).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Departemen</div>
                  <div className="font-medium">{detailRecord.employee?.departemen?.nama ?? '-'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Jam Masuk</div>
                  <div className="font-medium">{formatTimeToStringWithFix(detailRecord.check_in_time)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Jam Keluar</div>
                  <div className="font-medium">{formatTimeToStringWithFix(detailRecord.check_out_time)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Jam Kerja</div>
                  <div className="font-medium">{formatWorkingTime(detailRecord.working_time)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Jenis Status Karyawan</div>
                  <div className="font-medium">{detailRecord.employee?.statusJenis?.name ?? '-'}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-slate-500">Catatan</div>
                  <div className="font-medium">{detailRecord.notes || '-'}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Catatan Absensi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" value={editNotes} onChange={(e)=>setEditNotes(e.target.value)} placeholder="Masukkan catatan" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setEditOpen(false)}>Batal</Button>
            <Button onClick={saveNotes}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog (inline in dashboard) */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              CSV Upload Absensi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload-dashboard">Pilih File Excel/CSV</Label>
              <Input id="file-upload-dashboard" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">Maksimal 10MB. Kolom wajib: nik, date, check_in_time, check_out_time. Notes optional. Status dihitung otomatis.</p>
            </div>
            {uploadFile && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">File terpilih: <strong>{uploadFile.name}</strong></p>
                <p className="text-xs text-blue-600 mt-1">Ukuran: {(uploadFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkUploadOpen(false); setUploadFile(null); setUploadProgress(0); }} disabled={uploading}>Batal</Button>
            <Button onClick={handleBulkUpload} disabled={!uploadFile || uploading} className="bg-blue-600 hover:bg-blue-700">{uploading ? 'Uploading...' : 'Upload'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};