import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, CheckCircle, XCircle, Calendar, Upload, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AttendanceContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL || '';
  const selectedMonth = new Date().toISOString().slice(0, 7);

  // New: table state for today's attendance
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const fetchAttendanceToday = async () => {
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
    fetchAttendanceToday();
  }, []);

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
      await fetchAttendanceToday();
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
          <Button onClick={() => setBulkUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={downloadTemplate} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button onClick={fetchAttendanceToday} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table showing today's attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Absensi Hari Ini</CardTitle>
          <CardDescription>Daftar kehadiran karyawan untuk hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTable ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Nama Karyawan</th>
                    <th className="py-2 pr-4">Tanggal</th>
                    <th className="py-2 pr-4">Jam Masuk</th>
                    <th className="py-2 pr-4">Jam Keluar</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords
                    .filter((rec: any) => {
                      const recDate = new Date(rec.date).toISOString().slice(0,10);
                      const today = new Date().toISOString().slice(0,10);
                      return recDate === today;
                    })
                    .map((rec: any) => (
                      <tr key={rec.id} className="border-b">
                        <td className="py-2 pr-4">{rec.employee ? `${rec.employee.first_name ?? ''} ${rec.employee.last_name ?? ''}`.trim() : ''}</td>
                        <td className="py-2 pr-4">{new Date(rec.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 pr-4">{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('id-ID') : '-'}</td>
                        <td className="py-2 pr-4">{rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString('id-ID') : '-'}</td>
                        <td className="py-2 pr-4">{rec.status}</td>
                        <td className="py-2 pr-4">{rec.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {attendanceRecords.filter((rec: any) => new Date(rec.date).toISOString().slice(0,10) === new Date().toISOString().slice(0,10)).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data absensi untuk hari ini</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload Dialog (inline in dashboard) */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Bulk Upload Absensi
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