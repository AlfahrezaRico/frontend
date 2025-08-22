import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, CheckCircle, XCircle, Calendar, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

export const AttendanceContent = () => {
  const { toast } = useToast();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL || '';

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
    } catch (error: any) {
      setUploadProgress(0);
      toast({ title: 'Error', description: error.message || 'Gagal upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['nik', 'date', 'check_in_time', 'check_out_time', 'status', 'notes'],
      ['OPR00001', '2025-01-15', '08:00:00', '17:00:00', 'PRESENT', 'Hadir tepat waktu'],
      ['OPR00001', '2025-01-16', '08:30:00', '17:30:00', 'LATE', 'Terlambat 30 menit'],
      ['OPR00001', '2025-01-17', '', '', 'ABSENT', 'Sakit']
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
      'Kolom: nik, date, check_in_time, check_out_time, status, notes',
      'Status valid: PRESENT, ABSENT, LATE, HALF_DAY',
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
        </div>
      </div>



      {/* Content Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Absensi Hari Ini</CardTitle>
          <CardDescription>Daftar kehadiran karyawan untuk hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gunakan tombol di kanan atas untuk masuk ke halaman absensi lengkap</p>
            <p className="text-sm">Di sana tersedia fitur Bulk Upload (CSV/XLSX) dan Template</p>
          </div>
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
              <p className="text-xs text-gray-500 mt-1">Maksimal 10MB. Kolom: nik, date, check_in_time, check_out_time, status, notes</p>
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