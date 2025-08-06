import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Database, Play, Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const DatabaseTools = () => {
  const navigate = useNavigate();
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const backups = [
    { id: 1, filename: "backup_2024-01-02_02-00.sql", size: "2.4GB", date: "2024-01-02 02:00", status: "Completed" },
    { id: 2, filename: "backup_2024-01-01_02-00.sql", size: "2.3GB", date: "2024-01-01 02:00", status: "Completed" },
    { id: 3, filename: "backup_2023-12-31_02-00.sql", size: "2.2GB", date: "2023-12-31 02:00", status: "Completed" },
    { id: 4, filename: "backup_2023-12-30_02-00.sql", size: "2.2GB", date: "2023-12-30 02:00", status: "Completed" },
  ];

  const dbStats = [
    { table: "employees", rows: "142", size: "45MB" },
    { table: "attendance_records", rows: "2,847", size: "123MB" },
    { table: "leave_requests", rows: "456", size: "12MB" },
    { table: "payrolls", rows: "1,234", size: "67MB" },
    { table: "users", rows: "156", size: "8MB" },
  ];

  const handleCreateBackup = async () => {
    setLoadingBackup(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/database/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_SECRET}`
        }
      });
      if (!res.ok) throw new Error('Gagal membuat backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Backup Gagal',
        description: err instanceof Error ? err.message : 'Gagal membuat backup',
        variant: 'destructive',
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleRestore = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: 'Restore Gagal',
        description: 'Pilih file backup (.zip) terlebih dahulu!',
        variant: 'destructive',
      });
      return;
    }
    const file = fileInputRef.current.files[0];
    if (!file.name.endsWith('.zip')) {
      toast({
        title: 'Restore Gagal',
        description: 'File harus berformat .zip',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Konfirmasi Restore',
      description: 'Restore database akan MENGGANTI seluruh data. Klik tombol lagi untuk konfirmasi.',
      variant: 'default',
    });
    if (!window.confirm('Restore database akan MENGGANTI seluruh data. Lanjutkan?')) return;
    setLoadingRestore(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const formData = new FormData();
      formData.append('backup', file);
      const res = await fetch(`${API_URL}/api/database/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ADMIN_SECRET}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore gagal');
      toast({
        title: 'Restore Berhasil',
        description: 'Semua data telah diganti.',
        variant: 'default',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast({
        title: 'Restore Gagal',
        description: err instanceof Error ? err.message : 'Restore gagal',
        variant: 'destructive',
      });
    } finally {
      setLoadingRestore(false);
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">Database Tools</h1>
                <p className="text-sm text-gray-500">Tools untuk maintenance database</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Database Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Size</p>
                    <p className="text-2xl font-bold text-gray-900">2.4GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <RefreshCw className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Connections</p>
                    <p className="text-2xl font-bold text-gray-900">12/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-md">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-2xl font-bold text-green-600">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SQL Query Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                SQL Query Tool
              </CardTitle>
              <CardDescription>Jalankan query SQL custom (hanya SELECT)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="SELECT * FROM employees LIMIT 10;"
                className="min-h-[100px] font-mono"
              />
              <div className="flex space-x-2">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </Button>
                <Button variant="outline">Clear</Button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Query results akan muncul di sini...</p>
              </div>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Backup Database
                </CardTitle>
                <CardDescription>Buat backup database manual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Backup Filename</label>
                  <Input placeholder="backup_manual_2024-01-02" />
                </div>
                <Button className="w-full" onClick={handleCreateBackup} disabled={loadingBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  {loadingBackup ? 'Processing...' : 'Create Backup'}
                </Button>
                <p className="text-xs text-gray-500">
                  Backup akan disimpan di storage dan bisa didownload
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Restore Database
                </CardTitle>
                <CardDescription>Restore database dari backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Backup File</label>
                  <Input type="file" accept=".zip" ref={fileInputRef} disabled={loadingRestore} />
                </div>
                <Button variant="destructive" className="w-full" onClick={handleRestore} disabled={loadingRestore}>
                  <Upload className="h-4 w-4 mr-2" />
                  {loadingRestore ? 'Processing...' : 'Restore Database'}
                </Button>
                <p className="text-xs text-orange-600">
                  ⚠️ Proses ini akan mengganti seluruh data
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Backup</CardTitle>
              <CardDescription>Daftar backup yang tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{backup.date}</TableCell>
                      <TableCell>
                        <Badge variant="default">{backup.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik Tabel</CardTitle>
              <CardDescription>Informasi ukuran dan jumlah data per tabel</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{stat.table}</TableCell>
                      <TableCell>{stat.rows}</TableCell>
                      <TableCell>{stat.size}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default DatabaseTools;