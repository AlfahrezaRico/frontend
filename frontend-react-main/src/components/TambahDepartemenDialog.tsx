import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function DepartemenDialog() {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [departemen, setDepartemen] = useState<any[]>([]);
  const [editId, setEditId] = useState<string|null>(null);
  const { toast } = useToast();

  const fetchDepartemen = async () => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${API_URL}/api/departemen`);
    setDepartemen(await res.json());
  };
  useEffect(() => { if (open) fetchDepartemen(); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast({ title: 'Error', description: 'Nama departemen wajib diisi', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      let res, data;
      if (editId) {
        res = await fetch(`${API_URL}/api/departemen/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: nama.trim() })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: 'Berhasil', description: 'Departemen berhasil diupdate' });
      } else {
        res = await fetch(`${API_URL}/api/departemen`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: nama.trim() })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast({ title: 'Berhasil', description: 'Departemen berhasil ditambah' });
      }
      setNama(''); setEditId(null); fetchDepartemen();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal simpan departemen', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleEdit = (d: any) => { setEditId(d.id); setNama(d.nama); };
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus departemen ini?')) return;
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/departemen/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Berhasil', description: 'Departemen dihapus' });
      fetchDepartemen();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Gagal hapus departemen', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-700 hover:bg-green-800 text-white">Kelola Departemen</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kelola Departemen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nama">{editId ? 'Edit' : 'Tambah'} Departemen</Label>
            <Input id="nama" value={nama} onChange={e => setNama(e.target.value)} required autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            {editId && <Button type="button" variant="outline" onClick={() => { setEditId(null); setNama(''); }}>Batal Edit</Button>}
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : (editId ? 'Update' : 'Tambah')}</Button>
          </div>
        </form>
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Daftar Departemen</h4>
          <ul className="space-y-2">
            {departemen.map((d: any) => (
              <li key={d.id} className="flex items-center justify-between border-b pb-1">
                <span>{d.nama}</span>
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(d)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id)}>Hapus</Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
} 