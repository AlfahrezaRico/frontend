import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Eye, Check, X } from "lucide-react";
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { calculateLeaveDuration } from '@/utils/timeFormatter';

export const LeaveContent = () => {
  const { data: leaveRequests = [], isLoading, refetch } = useLeaveRequests();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const API_URL = import.meta.env.VITE_API_URL || '';
  
  const filteredRequests = leaveRequests.filter(request =>
    `${request.employee?.first_name} ${request.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleApproveLeave = async (id: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/api/leave-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'APPROVED',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti telah disetujui"
        });
        refetch();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menyetujui pengajuan cuti",
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

  const handleRejectLeave = async () => {
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
      const response = await fetch(`${API_URL}/api/leave-requests/${rejectingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'REJECTED',
          rejected_by: user?.id,
          rejection_reason: rejectReason.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Pengajuan cuti telah ditolak"
        });
        setRejectDialogOpen(false);
        setRejectingId(null);
        setRejectReason('');
        refetch();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Gagal menolak pengajuan cuti",
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

  const openViewDialog = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    return calculateLeaveDuration(startDate, endDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Cuti</h2>
        <p className="text-gray-600">Kelola pengajuan dan persetujuan cuti karyawan</p>
      </div>

      {/* Search and Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Pengajuan Cuti</CardTitle>
              <CardDescription>Kelola semua pengajuan cuti karyawan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari karyawan, alasan, atau status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading data pengajuan cuti...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Pengajuan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data pengajuan cuti'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.employee?.first_name} {request.employee?.last_name}
                        </TableCell>
                        <TableCell>{formatDate(request.start_date)}</TableCell>
                        <TableCell>{formatDate(request.end_date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {calculateDays(request.start_date, request.end_date)} hari
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openViewDialog(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status?.toLowerCase() === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApproveLeave(request.id)}
                                  disabled={processing}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openRejectDialog(request.id)}
                                  disabled={processing}
                                >
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
            <DialogTitle>Detail Pengajuan Cuti</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Informasi Karyawan</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nama:</span> {selectedRequest.employee?.first_name} {selectedRequest.employee?.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Departemen:</span> {selectedRequest.employee?.departemen?.nama || selectedRequest.employee?.department || '-'}
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Detail Cuti</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Jenis Cuti:</span>
                      <Badge variant="secondary">{selectedRequest.leave_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tanggal Mulai:</span>
                      <span>{formatDate(selectedRequest.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tanggal Selesai:</span>
                      <span>{formatDate(selectedRequest.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Durasi:</span>
                      <Badge variant="outline">{calculateDays(selectedRequest.start_date, selectedRequest.end_date)} hari</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Status & Tanggal</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tanggal Pengajuan:</span>
                      <span>{formatDate(selectedRequest.created_at)}</span>
                    </div>
                    {selectedRequest.status === 'APPROVED' && selectedRequest.approved_by && (
                      <div className="flex justify-between">
                        <span className="font-medium">Disetujui pada:</span>
                        <span>{formatDate(selectedRequest.approved_at || selectedRequest.updated_at)}</span>
                      </div>
                    )}
                    {selectedRequest.status === 'REJECTED' && selectedRequest.rejected_by && (
                      <div className="flex justify-between">
                        <span className="font-medium">Ditolak pada:</span>
                        <span>{formatDate(selectedRequest.rejected_at || selectedRequest.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Alasan Cuti</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedRequest.reason || 'Tidak ada alasan yang diberikan'}</p>
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedRequest.status === 'REJECTED' && selectedRequest.rejection_reason && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-900">Alasan Penolakan</h3>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-700">{selectedRequest.rejection_reason}</p>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan Cuti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject_reason">Alasan Penolakan</Label>
              <Textarea
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectLeave}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Memproses...' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};