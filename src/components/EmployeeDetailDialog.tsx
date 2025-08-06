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
  Eye,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeDetailDialogProps {
  employee: any;
}

export const EmployeeDetailDialog = ({ employee }: EmployeeDetailDialogProps) => {
  const { toast } = useToast();

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

  const handleCopy = (text: string, label: string) => {
    if (text && text !== '-') {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Berhasil',
        description: `${label} berhasil disalin`,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">Detail Karyawan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Profile */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {employee.first_name} {employee.last_name}
                  </h2>
                  <p className="text-gray-600 mb-2">{employee.position || 'Posisi tidak tersedia'}</p>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-blue-100 text-blue-800">
                      <Building2 className="w-3 h-3 mr-1" />
                      {employee.departemen?.nama || employee.department || 'Departemen tidak tersedia'}
                    </Badge>
                    <Badge className="border-green-200 text-green-700 border">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                    <span className="text-sm text-gray-500 font-mono">{employee.nik || '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Profil Karyawan</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm font-medium text-gray-800">{employee.email || '-'}</p>
                      </div>
                    </div>
                    {employee.email && employee.email !== '-' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(employee.email, 'Email')}
                        className="p-1 h-6 w-6 hover:bg-gray-200"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Nomor Telepon</p>
                        <p className="text-sm font-medium text-gray-800">{employee.phone_number || '-'}</p>
                      </div>
                    </div>
                    {employee.phone_number && employee.phone_number !== '-' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(employee.phone_number, 'Nomor telepon')}
                        className="p-1 h-6 w-6 hover:bg-gray-200"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Alamat</p>
                      <p className="text-sm font-medium text-gray-800">{employee.address || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tanggal Lahir</p>
                      <p className="text-sm font-medium text-gray-800">{formatBirthDate(employee.date_of_birth)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tanggal Bergabung</p>
                      <p className="text-sm font-medium text-gray-800">{formatDate(employee.hire_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">NIK</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{employee.nik || '-'}</p>
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
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Nama Bank</p>
                      <p className="text-sm font-medium text-gray-800">{employee.bank_name || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Nomor Rekening</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{employee.bank_account_number || '-'}</p>
                    </div>
                  </div>
                  {employee.bank_account_number && employee.bank_account_number !== '-' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(employee.bank_account_number, 'Nomor rekening')}
                      className="p-1 h-6 w-6 hover:bg-green-200"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 