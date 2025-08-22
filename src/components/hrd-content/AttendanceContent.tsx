import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, CheckCircle, XCircle, Calendar, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AttendanceContent = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Absensi</h2>
          <p className="text-gray-600">Monitor kehadiran dan jam kerja karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/attendance-management')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Kelola & Bulk Upload
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
    </div>
  );
};