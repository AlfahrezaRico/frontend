import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const IzinSakitList = ({ employeeId, all }: { employeeId?: string, all?: boolean }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgUrl, setImgUrl] = useState<string|null>(null);
  const [imgSignedUrl, setImgSignedUrl] = useState<string|null>(null);
  const [imgError, setImgError] = useState<string|null>(null);
  const [actionDialog, setActionDialog] = useState<{open: boolean, type: 'approve'|'reject'|null, id: string|null, keterangan: string}>({
    open: false, type: null, id: null, keterangan: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || '';
    let url = '';
    if (all) url = `${API_URL}/api/izin-sakit-all`;
    else if (employeeId) url = `${API_URL}/api/izin-sakit?employee_id=${employeeId}`;
    else return;
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        setData(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeeId, all]);

  useEffect(() => {
    if (!imgUrl) return;
    setImgSignedUrl(null);
    setImgError(null);
    const API_URL = import.meta.env.VITE_API_URL || '';
    fetch(`${API_URL}/api/izin-sakit-signed-url?path=${encodeURIComponent(imgUrl)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        if (res.signedUrl) setImgSignedUrl(res.signedUrl);
        else setImgError('Gagal mendapatkan signed URL');
      })
      .catch(() => setImgError('Gagal mendapatkan signed URL'));
  }, [imgUrl]);

  const handleAction = async () => {
    if (!actionDialog.id || !actionDialog.type) return;
    
    const API_URL = import.meta.env.VITE_API_URL || '';
    const url = `${API_URL}/api/izin-sakit/${actionDialog.id}/${actionDialog.type}`;
    
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keterangan: actionDialog.keterangan })
      });
      
      if (res.ok) {
        toast({
          title: actionDialog.type === 'approve' ? 'Berhasil Approve' : 'Berhasil Reject',
          description: 'Status izin/sakit telah diperbarui',
        });
        // Refresh data
        window.location.reload();
      } else {
        toast({
          title: 'Gagal',
          description: 'Terjadi kesalahan saat memperbarui status',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat memperbarui status',
        variant: 'destructive',
      });
    }
    
    setActionDialog({ open: false, type: null, id: null, keterangan: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-800">APPROVED</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800">REJECTED</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>;
    }
  };

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!data.length) return <div className="text-center text-gray-500 py-8">Belum ada pengajuan izin/sakit.</div>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {all && <TableHead>Nama Karyawan</TableHead>}
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Bukti</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Keterangan</TableHead>
            {all && <TableHead>Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {all && <TableCell>{row.employee?.first_name} {row.employee?.last_name}</TableCell>}
              <TableCell>{row.tanggal?.slice(0, 10)}</TableCell>
              <TableCell>{row.jenis}</TableCell>
              <TableCell>{row.alasan}</TableCell>
              <TableCell>
                {row.file_path && !row.file_path.startsWith('no-file-') ? (
                  <Button size="sm" variant="outline" onClick={() => setImgUrl(row.file_path)}>VIEW</Button>
                ) : '-'}
              </TableCell>
              <TableCell>{getStatusBadge(row.status)}</TableCell>
              <TableCell>{row.keterangan || '-'}</TableCell>
              {all && (
                <TableCell>
                  {row.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                        onClick={() => setActionDialog({ open: true, type: 'approve', id: row.id, keterangan: '' })}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => setActionDialog({ open: true, type: 'reject', id: row.id, keterangan: '' })}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Image Preview Dialog */}
      <Dialog open={!!imgUrl} onOpenChange={() => { setImgUrl(null); setImgSignedUrl(null); setImgError(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bukti Foto</DialogTitle>
          </DialogHeader>
          {imgSignedUrl && (
            <img src={imgSignedUrl} alt="Bukti Foto" className="w-full max-h-[500px] object-contain rounded border" onError={() => setImgError('Gagal menampilkan gambar')} />
          )}
          {imgError && <div className="text-red-600 font-bold">{imgError}<br/>Path: {imgUrl}</div>}
          {!imgSignedUrl && !imgError && <div className="text-gray-500">Memuat gambar...</div>}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, id: null, keterangan: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Approve Izin/Sakit' : 'Reject Izin/Sakit'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Keterangan (Opsional)</label>
              <Textarea
                placeholder={actionDialog.type === 'approve' ? 'Masukkan keterangan approve...' : 'Masukkan alasan reject...'}
                value={actionDialog.keterangan}
                onChange={(e) => setActionDialog(prev => ({ ...prev, keterangan: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, id: null, keterangan: '' })}>
              Batal
            </Button>
            <Button 
              onClick={handleAction}
              className={actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 