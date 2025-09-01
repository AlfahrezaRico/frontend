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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Absensi</h2>
          <p className="text-gray-600">Monitor kehadiran dan jam kerja karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 mr-4">
            <label className="text-sm text-gray-600">Filter Bulan:</label>
            <input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }} className="border rounded px-2 py-1" />
            <Input placeholder="Cari nama/status" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} className="w-52" />
          </div>
          <Button onClick={() => setBulkUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={downloadTemplate} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button onClick={fetchAttendance} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi Karyawan</CardTitle>
          <CardDescription>Daftar kehadiran karyawan</CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jam Masuk</TableHead>
                    <TableHead>Jam Pulang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((rec: any) => (
                    <TableRow key={rec.id}>
                      <TableCell>{rec.employee ? `${rec.employee.first_name ?? ''} ${rec.employee.last_name ?? ''}`.trim() : ''}</TableCell>
                      <TableCell>{new Date(rec.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{formatTimeToStringWithFix(rec.check_in_time)}</TableCell>
                      <TableCell>{formatTimeToStringWithFix(rec.check_out_time)}</TableCell>
                      <TableCell>{rec.status}</TableCell>
                      <TableCell>{rec.notes || '-'}</TableCell>
                      <TableCell className="text-right pr-6 flex justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => openDetail(rec)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {rec.status === 'LATE' && (!rec.notes || String(rec.notes).trim() === '') && (
                          <Button size="icon" variant="outline" className="w-9 h-9" onClick={() => openEdit(rec)}>
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
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} dari {filtered.length}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{'<'} Previous</Button>
                    <div className="px-3 py-2 text-sm">Halaman {page} / {totalPages}</div>
                    <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next {'>'}</Button>
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