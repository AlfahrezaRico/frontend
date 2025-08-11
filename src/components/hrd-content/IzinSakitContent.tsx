import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Search, Eye, Check, X, AlertTriangle, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  created_at?: string;
  employee?: {
    first_name: string;
    last_name: string;
    departemen?: {
      nama: string;
    };
  };
}

export const IzinSakitContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [izinSakitData, setIzinSakitData] = useState<IzinSakitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IzinSakitRecord | null>(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Add new state variables for approve/reject functionality
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
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
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openViewDialog = (record: IzinSakitRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleViewFile = async (filePath: string) => {
    try {
      setLoadingFile(true);
      setImageLoadError(false);
      // Get signed URL for file
      const response = await fetch(`${API_URL}/api/izin-sakit-signed-url?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        setFileUrl(data.signedUrl);
        setFileDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil file",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil file",
        variant: "destructive"
      });
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApproveIzin = async (id: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/izin-sakit/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          keterangan: 'Disetujui oleh HRD'
        })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan izin/sakit telah disetujui"
        });
        fetchIzinSakitData(); // Refresh data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menyetujui pengajuan izin/sakit",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyetujui pengajuan",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectIzin = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penolakan harus diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/izin-sakit/${rejectingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          keterangan: rejectReason.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan izin/sakit telah ditolak"
        });
        setRejectDialogOpen(false);
        setRejectingId(null);
        setRejectReason('');
        fetchIzinSakitData(); // Refresh data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menolak pengajuan izin/sakit",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menolak pengajuan",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectDialogOpen(true);
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
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        <TableCell>
                          {item.file_path && !item.file_path.startsWith('no-file-') ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewFile(item.file_path!)}
                              disabled={loadingFile}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              VIEW
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.employee?.departemen?.nama || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openViewDialog(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.status === 'PENDING' && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApproveIzin(item.id)} disabled={processing}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openRejectDialog(item.id)} disabled={processing}>
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

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Izin/Sakit</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Informasi Karyawan</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nama:</span> {selectedRecord.employee?.first_name} {selectedRecord.employee?.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Departemen:</span> {selectedRecord.employee?.departemen?.nama || '-'}
                  </div>
                </div>
              </div>

              {/* Izin/Sakit Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Detail Izin/Sakit</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Tanggal:</span>
                      <span>{formatDate(selectedRecord.tanggal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Jenis:</span>
                      <Badge variant="secondary">{selectedRecord.jenis}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedRecord.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Tanggal & Approval</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Tanggal Pengajuan:</span>
                      <span>{formatDate(selectedRecord.created_at || selectedRecord.tanggal)}</span>
                    </div>
                    {selectedRecord.status === 'APPROVED' && selectedRecord.approved_at && (
                      <div className="flex justify-between">
                        <span className="font-medium">Disetujui pada:</span>
                        <span>{formatDate(selectedRecord.approved_at)}</span>
                      </div>
                    )}
                    {selectedRecord.status === 'REJECTED' && selectedRecord.rejected_at && (
                      <div className="flex justify-between">
                        <span className="font-medium">Ditolak pada:</span>
                        <span>{formatDate(selectedRecord.rejected_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Alasan</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedRecord.alasan || 'Tidak ada alasan yang diberikan'}</p>
                </div>
              </div>

              {/* File attachment if available */}
              {selectedRecord.file_path && !selectedRecord.file_path.startsWith('no-file-') && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Lampiran</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">File lampiran tersedia</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewFile(selectedRecord.file_path!)}
                      disabled={loadingFile}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {loadingFile ? 'Loading...' : 'Lihat File'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejection Reason if rejected */}
              {selectedRecord.status === 'REJECTED' && selectedRecord.keterangan && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-900">Alasan Penolakan</h3>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-700">{selectedRecord.keterangan}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={(open) => {
        setFileDialogOpen(open);
        if (!open) {
          setImageLoadError(false);
          setFileUrl(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Preview File Lampiran</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {fileUrl && (
              <div className="w-full h-full flex items-center justify-center">
                {!imageLoadError ? (
                  <img 
                    src={fileUrl} 
                    alt="File lampiran" 
                    className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-lg border shadow-lg"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Preview tidak tersedia</p>
                    <Button asChild>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 flex justify-between bg-white border-t pt-4">
            <Button variant="outline" onClick={() => setFileDialogOpen(false)}>
              Tutup
            </Button>
            {fileUrl && (
              <Button asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penolakan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason" className="text-sm font-medium">
              Alasan Penolakan
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRejectIzin} disabled={processing}>
              {processing ? 'Menolak...' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};