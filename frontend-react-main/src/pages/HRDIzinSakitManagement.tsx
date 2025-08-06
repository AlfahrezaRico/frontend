import { IzinSakitList } from './dashboard/IzinSakitList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HRDIzinSakitManagement = () => {
  const navigate = useNavigate();

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
                onClick={() => navigate('/dashboard/hrd')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manajemen Izin/Sakit</h1>
                <p className="text-sm text-gray-500">Kelola pengajuan izin/sakit karyawan</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Daftar Pengajuan Izin/Sakit
            </h2>
            <p className="text-gray-600">
              Lihat dan kelola semua pengajuan izin/sakit dari karyawan
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Izin/Sakit</CardTitle>
              <CardDescription>
                Semua pengajuan izin/sakit karyawan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IzinSakitList all />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HRDIzinSakitManagement; 