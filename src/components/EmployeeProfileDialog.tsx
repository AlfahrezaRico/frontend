import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  Banknote,
  Calendar,
  CalendarDays,
  UserCheck,
  Building2,
  Download,
  Edit,
  Share2
} from 'lucide-react';

interface EmployeeProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
}

export const EmployeeProfileDialog = ({ open, onOpenChange, profile }: EmployeeProfileDialogProps) => {
  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profil Karyawan</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat data profil...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return new Date(dateString).toLocaleDateString('id-ID');
    }
  };

  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return new Date(dateString).toLocaleDateString('id-ID');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">Profil Karyawan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Profile */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-600 mb-2">{profile.position || 'Posisi tidak tersedia'}</p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    <Building2 className="w-3 h-3 mr-1" />
                    {profile.departemen?.nama || profile.department || 'Departemen tidak tersedia'}
                  </Badge>
                  <Badge className="border-green-200 text-green-700 border">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Informasi Pribadi</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="text-sm font-medium text-gray-800">{profile.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Nomor Telepon</p>
                      <p className="text-sm font-medium text-gray-800">{profile.phone_number || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Alamat</p>
                      <p className="text-sm font-medium text-gray-800">{profile.address || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tanggal Lahir</p>
                      <p className="text-sm font-medium text-gray-800">{formatBirthDate(profile.date_of_birth)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tanggal Bergabung</p>
                      <p className="text-sm font-medium text-gray-800">{formatDate(profile.hire_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">NIK</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{profile.nik || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Informasi Bank</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nomor Rekening</p>
                    <p className="text-sm font-medium text-gray-800 font-mono">{profile.bank_account_number || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Building className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Nama Bank</p>
                    <p className="text-sm font-medium text-gray-800">{profile.bank_name || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Cetak Profil
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
            <Button className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 