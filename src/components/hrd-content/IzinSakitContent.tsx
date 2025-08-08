import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Eye, Check, X, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

interface IzinSakitRecord {
  id: string;
  employee_id: string;
  tanggal: string;
  jenis: string;
  alasan: string;
  file_path?: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  keterangan?: string;
  employee?: {
    first_name: string;
    last_name: string;
    departemen?: {
      nama: string;
    };
  };
}

export const IzinSakitContent = () => {
  const [izinSakitData, setIzinSakitData] = useState<IzinSakitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || '';

  const fetchIzinSakitData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/izin-sakit-all`);
      if (response.ok) {
        const data = await response.json();
        setIzinSakitData(data);
      }
    } catch (error) {
      console.error('Error fetching izin sakit data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIzinSakitData();
  }, []);

  const filteredData = izinSakitData.filter(item =>
    `${item.employee?.first_name} ${item.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alasan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = izinSakitData.filter(item => item.status === 'PENDING');
  const approvedRequests = izinSakitData.filter(item => item.status === 'APPROVED');
  const rejectedRequests = izinSakitData.filter(item => item.status === 'REJECTED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Izin/Sakit</h2>
        <p className="text-gray-600">Urus izin sakit dan persetujuan karyawan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Perlu review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Izin approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Izin ditolak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{izinSakitData.length}</div>
            <p className="text-xs text-muted-foreground">Semua pengajuan</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Izin/Sakit</CardTitle>
              <CardDescription>Kelola semua pengajuan izin dan sakit karyawan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari karyawan, jenis, atau alasan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading data izin/sakit...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data izin/sakit'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.employee?.first_name} {item.employee?.last_name}
                        </TableCell>
                        <TableCell>{formatDate(item.tanggal)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.jenis}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.alasan}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.employee?.departemen?.nama || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.status === 'PENDING' && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};