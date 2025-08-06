
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from "react";

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Ambil employee_id user login
  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (user?.id) {
        const res = await fetch(`${API_URL}/api/employees?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployeeId(data?.id || null);
        }
      }
    };
    fetchEmployeeId();
  }, [user]);

  // Ambil role user login
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        const res = await fetch(`${API_URL}/api/user-role?user_id=${user.id}`);
        const data = await res.json();
        setUserRole(data?.role || null);
      }
    };
    fetchUserRole();
  }, [user]);

  // Jangan panggil hook sebelum employeeId siap jika karyawan
  const shouldFetch = !(location.state?.onlyMe && !employeeId);
  // GANTI: data attendance menjadi state lokal kosong agar tidak error render
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Jika karyawan dan employeeId belum siap, tampilkan loading
  if (location.state?.onlyMe && !employeeId) {
    return <div className="min-h-screen flex items-center justify-center">Loading data absensi...</div>;
  }

  // Filter dan pagination
  const filteredRecords = attendanceRecords.filter(rec => {
    const q = search.toLowerCase();
    return (
      rec.employee?.first_name?.toLowerCase().includes(q) ||
      rec.employee?.last_name?.toLowerCase().includes(q) ||
      rec.employee?.email?.toLowerCase().includes(q) ||
      rec.employee?.department?.toLowerCase().includes(q) ||
      rec.employee?.position?.toLowerCase().includes(q) ||
      rec.status?.toLowerCase().includes(q)
    );
  });
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // Filter data jika karyawan dan state.onlyMe true
  const match = (rec: any) => {
    let match = true;
    if (location.state?.onlyMe && employeeId) {
      match = rec.employee_id === employeeId;
    }
    // Filter bulan
    if (selectedMonth) {
      const recMonth = rec.date.slice(0, 7);
      match = match && recMonth === selectedMonth;
    }
    return match;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Hadir</span>
        );
      case "ABSENT":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Tidak Hadir</span>
        );
      case "LATE":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Terlambat</span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(userRole === "karyawan" ? "/dashboard/karyawan" : "/dashboard/hrd")
                }
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Data Absensi</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Riwayat Absensi
              </CardTitle>
              <CardDescription>
                Monitor kehadiran dan jam kerja semua karyawan
              </CardDescription>
              <div className="mt-4">
                <label className="mr-2 font-medium">Filter Bulan:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div>
                  {/* Search Bar */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="border px-2 py-1 rounded w-64"
                      placeholder="Cari nama, email, departemen, posisi, status..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                    />
                    <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={() => { setSearch(searchInput); setPage(1); }}>Cari</button>
                  </div>
                  {/* Tabel Absensi */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      {pagedRecords.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : ''}
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          {record.check_in_time ?
                            new Date(record.check_in_time).toLocaleTimeString('id-ID') :
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {record.check_out_time ?
                            new Date(record.check_out_time).toLocaleTimeString('id-ID') :
                            '-'
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  {/* Pagination Controls */}
                  <div className="flex justify-center items-center mt-4 gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt; Sebelumnya</button>
                    <span>Halaman {page} dari {totalPages}</span>
                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">Selanjutnya &gt;</button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AttendanceManagement;
