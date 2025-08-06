import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from '@/hooks/useEmployees';
import * as XLSX from 'xlsx';
import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const HRReports = () => {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedLeaveMonth, setSelectedLeaveMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)));

  const filteredEmployees = selectedDept
    ? employees.filter(emp => emp.department === selectedDept)
    : employees;

  const filteredAttendance = attendanceRecords.filter(rec => {
    if (!selectedMonth) return true;
    return rec.date && rec.date.slice(0, 7) === selectedMonth;
  });

  const filteredLeave = leaveRequests.filter(rec => {
    if (!selectedLeaveMonth) return true;
    return rec.start_date && rec.start_date.slice(0, 7) === selectedLeaveMonth;
  });

  const generateEmployeeReport = () => {
    const data = filteredEmployees.map(emp => ({
      'Nama Karyawan': `${emp.first_name} ${emp.last_name}`,
      'Email': emp.email,
      'Telepon': emp.phone_number,
      'Posisi': emp.position,
      'Departemen': emp.department,
      'Tanggal Bergabung': emp.hire_date ? format(new Date(emp.hire_date), 'dd MMMM yyyy', { locale: id }) : '-',
      'NIK': emp.nik || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Karyawan');
    XLSX.writeFile(workbook, `Laporan_Karyawan${selectedDept ? '_' + selectedDept : ''}.xlsx`);
  };

  const generateAttendanceReport = () => {
    const data = filteredAttendance.map(rec => ({
      'Nama': rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : '-',
      'Tanggal': rec.date ? new Date(rec.date).toLocaleDateString('id-ID') : '',
      'Check In': rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
      'Check Out': rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
      'Status': rec.status || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi');
    XLSX.writeFile(workbook, `Laporan_Absensi_${selectedMonth}.xlsx`);
  };

  const generateLeaveReport = () => {
    const data = filteredLeave.map(rec => ({
      'Nama': rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : '-',
      'Jenis Cuti': rec.leave_type,
      'Tanggal Mulai': rec.start_date ? new Date(rec.start_date).toLocaleDateString('id-ID') : '',
      'Tanggal Selesai': rec.end_date ? new Date(rec.end_date).toLocaleDateString('id-ID') : '',
      'Alasan': rec.reason,
      'Status': rec.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuti');
    XLSX.writeFile(workbook, `Laporan_Cuti_${selectedLeaveMonth}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/hrd')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Laporan HR</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {employees.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Record Absensi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceRecords.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pengajuan Cuti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {leaveRequests.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Generation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Laporan Karyawan</CardTitle>
                <CardDescription>
                  Generate laporan data karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Filter Departemen:</label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Semua</option>
                    {uniqueDepartments.map((dept, idx) => (
                      <option key={String(dept) || idx} value={String(dept)}>{String(dept)}</option>
                    ))}
                  </select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={generateEmployeeReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Laporan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Laporan Absensi</CardTitle>
                <CardDescription>
                  Generate laporan kehadiran karyawan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Filter Bulan:</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={generateAttendanceReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Laporan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Laporan Cuti</CardTitle>
                <CardDescription>
                  Generate laporan pengajuan cuti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Filter Bulan:</label>
                  <input
                    type="month"
                    value={selectedLeaveMonth}
                    onChange={e => setSelectedLeaveMonth(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700" 
                  onClick={generateLeaveReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Laporan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HRReports;
