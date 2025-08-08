import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, CheckCircle, XCircle, Calendar } from "lucide-react";

export const AttendanceContent = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Absensi</h2>
        <p className="text-gray-600">Monitor kehadiran dan jam kerja karyawan</p>
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
            <p>Fitur detail absensi akan segera hadir</p>
            <p className="text-sm">Untuk saat ini, gunakan menu navigasi untuk mengakses halaman absensi lengkap</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};