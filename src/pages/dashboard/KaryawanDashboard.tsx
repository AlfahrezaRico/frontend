import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Clock, Calendar, FileText, LogOut, Bell, Download, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { IzinSakitList } from './IzinSakitList';
import { EmployeeProfileDialog } from '@/components/EmployeeProfileDialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';

const KaryawanDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  // State user login
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [quota, setQuota] = useState<{ total_quota: number; used_quota: number } | null>(null);

  const [izinDialogOpen, setIzinDialogOpen] = useState(false);
  const [izinForm, setIzinForm] = useState({ tanggal: '', jenis: '', alasan: '', file: null });
  const [izinLoading, setIzinLoading] = useState(false);
  const [izinListOpen, setIzinListOpen] = useState(false);

  // State untuk notifikasi
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // State untuk slip gaji
  const [slipGajiDialogOpen, setSlipGajiDialogOpen] = useState(false);
  const [availablePayrolls, setAvailablePayrolls] = useState<any[]>([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('');
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(false);

  useEffect(() => {
    // Hapus import Moon, Sun, dan DarkModeContext
    // Hapus button toggle darkmode dari header
  }, []);

  const handleIzinFile = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Ukuran file maksimal 2MB', variant: 'destructive' });
      return;
    }
    setIzinForm(f => ({ ...f, file }));
  };

  const handleIzinSubmit = async (e) => {
    e.preventDefault();
    if (!izinForm.tanggal || !izinForm.jenis || !izinForm.alasan || !izinForm.file) {
      toast({ title: 'Error', description: 'Semua field wajib diisi dan upload foto', variant: 'destructive' });
      return;
    }
    setIzinLoading(true);
    try {
      const formData = new FormData();
      formData.append('tanggal', izinForm.tanggal);
      formData.append('jenis', izinForm.jenis);
      formData.append('alasan', izinForm.alasan);
      formData.append('file', izinForm.file);
      formData.append('employee_id', profile.id); // Tambahkan employee_id
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/izin-sakit`, { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Gagal',
          description: data.error || 'Gagal mengajukan izin/sakit',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Berhasil',
          description: 'Pengajuan izin/sakit berhasil dikirim',
        });
        setIzinDialogOpen(false);
        setIzinForm({ tanggal: '', jenis: '', alasan: '', file: null });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Gagal mengirim pengajuan izin/sakit', variant: 'destructive' });
    } finally {
      setIzinLoading(false);
    }
  };

  // Ambil userId dari context/auth
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Ambil profile employee setelah userId siap
  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/employees?user_id=${userId}&include_departemen=1`);
      if (res.ok) {
        const profil = await res.json();
        setProfile(profil);
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [userId]);

  // Fetch quota
  useEffect(() => {
    if (!userId) return;
    const fetchQuota = async () => {
      const year = new Date().getFullYear();
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/leave-quotas/me?user_id=${userId}&year=${year}&quota_type=tahunan`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setQuota({ total_quota: data[0].total_quota, used_quota: data[0].used_quota });
        } else {
          setQuota(null);
        }
      } else {
        setQuota(null);
      }
    };
    fetchQuota();
  }, [userId]);

  // Load read notifications from localStorage
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`readNotifications_${userId}`);
      if (saved) {
        setReadNotifications(new Set(JSON.parse(saved)));
      }
    }
  }, [userId]);

  // Fetch notifikasi cuti yang ditolak
  useEffect(() => {
    if (!userId) return;
    const fetchRejectedRequests = async () => {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/notifications/rejected-leaves?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRejectedRequests(data);
      } else {
        setRejectedRequests([]);
      }
    };
    fetchRejectedRequests();
    
    // Auto-refresh notifikasi setiap 30 detik
    const interval = setInterval(fetchRejectedRequests, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Tampilkan toast ketika ada notifikasi baru (hanya sekali)
  useEffect(() => {
    const unreadCount = rejectedRequests.filter(req => !readNotifications.has(req.id)).length;
    if (unreadCount > 0 && !readNotifications.size) {
      // Cek request yang belum dibaca
      const unreadRequests = rejectedRequests.filter(req => !readNotifications.has(req.id));
      
      // Hitung berdasarkan status
      const rejectedCount = unreadRequests.filter(req => req.status === 'REJECTED').length;
      const approvedCount = unreadRequests.filter(req => req.status === 'APPROVED').length;
      
      // Tampilkan notifikasi untuk REJECTED
      if (rejectedCount > 0) {
        toast({
          title: 'Pengajuan Ditolak',
          description: `Ada ${rejectedCount} pengajuan yang ditolak. Silakan cek notifikasi.`,
          variant: 'destructive',
        });
      }
      
      // Tampilkan notifikasi untuk APPROVED
      if (approvedCount > 0) {
        toast({
          title: 'Pengajuan Disetujui',
          description: `Ada ${approvedCount} pengajuan yang disetujui. Silakan cek notifikasi.`,
          variant: 'default',
        });
      }
    }
  }, [rejectedRequests.length, readNotifications.size, toast]);

  // PATCH: Render loading jika profile atau profile.id belum siap
  if (!profile || !profile.id) {
    return <div className="min-h-screen flex items-center justify-center">Loading data karyawan...</div>;
  }

  // Hitung notifikasi yang belum dibaca
  const unreadNotifications = rejectedRequests.filter(req => !readNotifications.has(req.id));
  const unreadCount = unreadNotifications.length;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Handler navigasi
  const handleAjukanCuti = () => {
    navigate("/leave-management", { state: { onlyMe: true } });
  };
  const handleRiwayatAbsensi = () => {
    navigate("/attendance-management", { state: { onlyMe: true } });
  };

  // Fetch available payrolls for employee
  const fetchAvailablePayrolls = async () => {
    if (!profile?.id) return;
    
    setLoadingPayrolls(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/payrolls?employee_id=${profile.id}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        // Filter only PAID payrolls
        const paidPayrolls = data.filter((p: any) => p.status === 'PAID' || p.status === 'APPROVED');
        setAvailablePayrolls(paidPayrolls);
        
        if (paidPayrolls.length === 0) {
          toast({
            title: 'Informasi',
            description: 'Belum ada slip gaji yang tersedia untuk diunduh',
            variant: 'default'
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Gagal mengambil data payroll',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data payroll',
        variant: 'destructive'
      });
    } finally {
      setLoadingPayrolls(false);
    }
  };

  // Open slip gaji dialog and fetch payrolls
  const handleOpenSlipGajiDialog = () => {
    setSlipGajiDialogOpen(true);
    fetchAvailablePayrolls();
  };

   
  // Generate and download PDF slip gaji
  const handleDownloadSlipGaji = async () => {
    if (!selectedPayrollId) {
      toast({
        title: 'Error',
        description: 'Silakan pilih tanggal pembayaran terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    setDownloadingSlip(true);
    try {
      const payroll = availablePayrolls.find(p => p.id === selectedPayrollId);
      if (!payroll) {
        throw new Error('Data payroll tidak ditemukan');
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const margin = 10;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 15;

      // Helper to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rp 0';
  return `Rp ${Math.round(Number(amount)).toLocaleString('id-ID')}`; // <--- INI PERBAIKANNYA
};
      // Helper to calculate percentage string, removing trailing .00 or .X0
      const getPercentageString = (value, base) => {
          if (!base || base == 0) return '';
          const percentage = ((Number(value) / Number(base)) * 100).toFixed(2).replace(/\.00$/, '').replace(/\.([1-9])0$/, '.$1');
          return `${percentage}%`;
      };
      
      // --- DRAW HEADER ---
      try {
        const response = await fetch('/logo.jpg');
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => reader.result ? resolve(reader.result as string) : reject(new Error('Failed to read file'));
            reader.onerror = reject;
          });
          reader.readAsDataURL(blob);
          const base64Logo = await base64Promise;
          doc.addImage(base64Logo, 'JPEG', margin, yPos - 8, 25, 12);
        }
      } catch (logoError) {
        console.error('Error loading logo:', logoError);
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // --- DRAW EMPLOYEE INFO TABLE ---
      const infoYStart = yPos;
      const rowHeight = 6;
      const col1X = margin;
      const col2X = margin + 25;
      const col3X = margin + 95;
      const col4X = margin + 120;

      doc.setFillColor(248, 250, 252); // Light gray background
      doc.rect(margin, infoYStart, contentWidth, rowHeight * 4, 'F');

      const infoData = [
          { key: 'NAMA', value: `${profile?.first_name || ''} ${profile?.last_name || ''}`, key2: 'JABATAN', value2: profile?.position || '-' },
          { key: 'NIK', value: profile?.nik || '-', key2: 'STATUS', value2: payroll.status },
          { key: 'UNIT / CABANG', value: 'PUSAT', key2: 'TANGGAL', value2: format(new Date(payroll.payment_date), 'dd-MMM-yyyy', { locale: id }) },
          { key: 'DIVISI / GROUP', value: profile?.departemen?.nama || 'OPERASIONAL', key2: profile?.bank_name || 'BANK', value2: profile?.bank_account_number || '-' }
      ];

      infoData.forEach((row, index) => {
          const currentY = infoYStart + (index * rowHeight) + 4;
          doc.setFont(undefined, 'bold');
          doc.setFontSize(8);
          doc.text(row.key, col1X, currentY);
          doc.text(row.key2, col3X, currentY);

          doc.setFont(undefined, 'normal');
          doc.text(row.value, col2X, currentY);
          doc.text(row.value2, col4X, currentY);
      });
      yPos = infoYStart + (rowHeight * 4) + 5;

      // --- DRAW PAYROLL DETAILS ---
      const drawSectionHeader = (y, text, bgColor) => {
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(margin, y, contentWidth, 7, 'F');
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          const isDarkBg = (bgColor[0] * 0.299 + bgColor[1] * 0.587 + bgColor[2] * 0.114) < 186;
          doc.setTextColor(isDarkBg ? 255 : 0, isDarkBg ? 255 : 0, isDarkBg ? 255 : 0);
          doc.text(text, margin + 2, y + 5);
          return y + 7;
      };

      const drawSubHeader = (y, text) => {
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0,0,0);
          doc.text(text, margin + 2, y + 5);
          return y + 7;
      };

      const drawDataRow = (y, label, value, bgColor = null, isBold = false) => {
          if (bgColor) {
              doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
              doc.rect(margin, y, contentWidth, 6, 'F');
          }
          doc.setFontSize(8);
          doc.setFont(undefined, isBold ? 'bold' : 'normal');
          doc.setTextColor(0,0,0);
          doc.text(label, margin + 4, y + 4.5);
          doc.text(value, pageWidth - margin - 4, y + 4.5, { align: 'right' });
          return y + 6;
      };
      
      // PENDAPATAN
      yPos = drawSectionHeader(yPos, 'PENDAPATAN', [229, 239, 247]); // Light Blue
      yPos = drawSubHeader(yPos, 'PENDAPATAN TETAP');
      yPos = drawDataRow(yPos, 'Gaji Pokok', formatCurrency(payroll.basic_salary));
      if (Number(payroll.jht_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JHT ${getPercentageString(payroll.jht_company, payroll.basic_salary)}`, formatCurrency(payroll.jht_company));
      if (Number(payroll.jkm_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JKM ${getPercentageString(payroll.jkm_company, payroll.basic_salary)}`, formatCurrency(payroll.jkm_company));
      if (Number(payroll.jkk_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JKK ${getPercentageString(payroll.jkk_company, payroll.basic_salary)}`, formatCurrency(payroll.jkk_company));
      if (Number(payroll.jp_company) > 0) yPos = drawDataRow(yPos, `BPJS Jaminan Pensiun ${getPercentageString(payroll.jp_company, payroll.basic_salary)}`, formatCurrency(payroll.jp_company));
      if (Number(payroll.bpjs_health_company) > 0) yPos = drawDataRow(yPos, `BPJS Kesehatan ${getPercentageString(payroll.bpjs_health_company, payroll.basic_salary)}`, formatCurrency(payroll.bpjs_health_company));
      
      // --- PENAMBAHAN TUNJANGAN TETAP ---
      yPos = drawDataRow(yPos, 'Tunjangan Jabatan', formatCurrency(payroll.position_allowance));
      yPos = drawDataRow(yPos, 'Tunjangan Pengurus', formatCurrency(payroll.management_allowance));
      yPos = drawDataRow(yPos, 'Tunjangan Pulsa', formatCurrency(payroll.phone_allowance));
      // --- AKHIR PENAMBAHAN ---
      
      const subTotalPendapatanTetap = (Number(payroll.basic_salary) || 0) + 
                                      (Number(payroll.subtotal_company) || 0) +
                                      (Number(payroll.position_allowance) || 0) +
                                      (Number(payroll.management_allowance) || 0) +
                                      (Number(payroll.phone_allowance) || 0);
      yPos = drawDataRow(yPos, 'SUB TOTAL', formatCurrency(subTotalPendapatanTetap), [228, 248, 233], true); // Light Green
      
      yPos = drawSubHeader(yPos, 'PENDAPATAN TIDAK TETAP');
      // --- PENAMBAHAN TUNJANGAN TIDAK TETAP ---
      yPos = drawDataRow(yPos, 'Tunjangan Insentif', formatCurrency(payroll.incentive_allowance));
      yPos = drawDataRow(yPos, 'Tunjangan Lembur', formatCurrency(payroll.overtime_allowance));
      // --- AKHIR PENAMBAHAN ---

      const subTotalPendapatanTidakTetap = (Number(payroll.incentive_allowance) || 0) + (Number(payroll.overtime_allowance) || 0);
      yPos = drawDataRow(yPos, 'SUB TOTAL', formatCurrency(subTotalPendapatanTidakTetap), [228, 248, 233], true); // Light Green

      yPos = drawSectionHeader(yPos, 'TOTAL PENDAPATAN', [29, 78, 216]); // Blue
      doc.text(formatCurrency(payroll.total_pendapatan), pageWidth - margin - 4, yPos - 2, { align: 'right' });
      
      // PEMOTONGAN
      yPos += 3;
      yPos = drawSectionHeader(yPos, 'PEMOTONGAN', [254, 226, 226]); // Light Red
      yPos = drawSubHeader(yPos, 'PERUSAHAAN');
      if (Number(payroll.jht_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JHT ${getPercentageString(payroll.jht_company, payroll.basic_salary)}`, formatCurrency(payroll.jht_company));
      if (Number(payroll.jkm_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JKM ${getPercentageString(payroll.jkm_company, payroll.basic_salary)}`, formatCurrency(payroll.jkm_company));
      if (Number(payroll.jkk_company) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JKK ${getPercentageString(payroll.jkk_company, payroll.basic_salary)}`, formatCurrency(payroll.jkk_company));
      if (Number(payroll.jp_company) > 0) yPos = drawDataRow(yPos, `BPJS Jaminan Pensiun ${getPercentageString(payroll.jp_company, payroll.basic_salary)}`, formatCurrency(payroll.jp_company));
      if (Number(payroll.bpjs_health_company) > 0) yPos = drawDataRow(yPos, `BPJS Kesehatan ${getPercentageString(payroll.bpjs_health_company, payroll.basic_salary)}`, formatCurrency(payroll.bpjs_health_company));
      yPos = drawDataRow(yPos, 'SUB TOTAL', formatCurrency(payroll.subtotal_company), [254, 226, 226], true); // Light Red
      
      yPos = drawSubHeader(yPos, 'KARYAWAN');
      if (Number(payroll.bpjs_health_employee) > 0) yPos = drawDataRow(yPos, `BPJS Kesehatan ${getPercentageString(payroll.bpjs_health_employee, payroll.basic_salary)}`, formatCurrency(payroll.bpjs_health_employee));
      if (Number(payroll.jht_employee) > 0) yPos = drawDataRow(yPos, `BPJS Ketenagakerjaan JHT ${getPercentageString(payroll.jht_employee, payroll.basic_salary)}`, formatCurrency(payroll.jht_employee));
      if (Number(payroll.jp_employee) > 0) yPos = drawDataRow(yPos, `BPJS Jaminan Pensiun ${getPercentageString(payroll.jp_employee, payroll.basic_salary)}`, formatCurrency(payroll.jp_employee));
      yPos = drawDataRow(yPos, 'KASBON', formatCurrency(payroll.kasbon));
      yPos = drawDataRow(yPos, 'Angsuran Kredit', formatCurrency(payroll.angsuran_kredit));
      yPos = drawDataRow(yPos, 'Telat', formatCurrency(payroll.telat));
      const subTotalKaryawan = (Number(payroll.subtotal_employee) || 0) + (Number(payroll.total_deductions_manual) || 0);
      yPos = drawDataRow(yPos, 'SUB TOTAL', formatCurrency(subTotalKaryawan), [254, 226, 226], true); // Light Red

      const totalPotongan = (Number(payroll.total_deductions_bpjs) || 0) + (Number(payroll.total_deductions_manual) || 0);
      yPos = drawSectionHeader(yPos, 'TOTAL PEMOTONGAN', [220, 38, 38]); // Red
      doc.text(formatCurrency(totalPotongan), pageWidth - margin - 4, yPos - 2, { align: 'right' });
      
      // PENGHASILAN BERSIH
      yPos = drawSectionHeader(yPos, 'PENGHASILAN BERSIH', [29, 78, 216]); // Blue
      doc.text(formatCurrency(payroll.net_salary), pageWidth - margin - 4, yPos - 2, { align: 'right' });
      
      // --- FOOTER ---
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`Dicetak pada: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })}`, pageWidth / 2, yPos + 5, { align: 'center' });

      // --- SAVE PDF ---
      const fileName = `SlipGaji_${profile?.first_name}_${format(new Date(payroll.payment_date), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
      
      toast({ title: 'Berhasil', description: 'Slip gaji berhasil diunduh' });
      setSlipGajiDialogOpen(false);
      setSelectedPayrollId('');
    } catch (error) {
      console.error('Error generating slip gaji:', error);
      toast({ title: 'Error', description: 'Gagal membuat slip gaji', variant: 'destructive' });
    } finally {
      setDownloadingSlip(false);
    }
  };

  const handleNotificationClick = async (request: any) => {
    try {
      // Mark notification as read
      const API_URL = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          notification_id: request.id 
        })
      });
      
      // Add to read notifications
      const newReadNotifications = new Set([...readNotifications, request.id]);
      setReadNotifications(newReadNotifications);
      
      // Save to localStorage
      localStorage.setItem(`readNotifications_${userId}`, JSON.stringify([...newReadNotifications]));
      
      // Navigate based on request type
      if (request.request_type === 'izin_sakit') {
        // For izin/sakit, just close dialog since there's no specific page
        setNotificationOpen(false);
      } else {
        // For leave requests, navigate to leave management
        navigate("/leave-management", { state: { onlyMe: true } });
      }
      
      // Close notification dialog
      setNotificationOpen(false);
      
      toast({
        title: 'Notifikasi Dibaca',
        description: 'Notifikasi telah ditandai sebagai dibaca',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      if (request.request_type === 'izin_sakit') {
        setNotificationOpen(false);
      } else {
        navigate("/leave-management", { state: { onlyMe: true } });
      }
      setNotificationOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">HRIS KSP Mekarsari</h1>
              <p className="text-sm text-gray-500 dark:text-gray-300">Employee Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifikasi Bell */}
            <div className="relative">
              <Button 
                onClick={() => setNotificationOpen(true)} 
                variant="outline" 
                size="sm"
                className="relative"
              >
                <Bell className={`h-4 w-4 mr-2 ${unreadCount > 0 ? 'animate-bell-ring text-red-500' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-red">
                    {unreadCount}
                  </span>
                )}
                Notifikasi
              </Button>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang, {profile ? `${profile.first_name} ${profile.last_name}` : '...' }
            </h2>
            <p className="text-gray-600">
              Kelola absensi, cuti, dan informasi personal Anda
            </p>
          </div>
          
          {/* Ringkasan Sisa Cuti */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Sisa Cuti Tahunan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {quota ? `${quota.total_quota - (quota.used_quota || 0)} hari` : 'Belum diatur'}
                </div>
                <p className="text-xs text-gray-500">
                  {quota ? `Total: ${quota.total_quota} | Terpakai: ${quota.used_quota || 0}` : 'Hubungi HRD jika data tidak muncul'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card Pengajuan Izin/Sakit di kiri */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="items-center">
                <CardTitle className="text-blue-800 flex flex-col items-center gap-2"><Calendar className="w-8 h-8 mb-2" />Pengajuan Izin/Sakit</CardTitle>
                <CardDescription className="text-center">Ajukan izin atau sakit dengan cepat</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-lg shadow transition disabled:bg-gray-200 disabled:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                  style={{ fontSize: '1.1rem' }}
                  onClick={() => setIzinDialogOpen(true)}
                  disabled={izinLoading}
                >
                  Ajukan Izin/Sakit
                </Button>
              </CardContent>
            </Card>

            {/* Card Profil Saya di tengah, icon di tengah */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="items-center">
                <User className="w-8 h-8 text-blue-700 mb-2 mx-auto" />
                <CardTitle className="text-blue-700 text-center">Profil Saya</CardTitle>
                <CardDescription className="text-center">Lihat data diri dan informasi karyawan</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" onClick={() => setProfileDialogOpen(true)}>
                  Lihat Profil
                </Button>
              </CardContent>
            </Card>

            {/* Card Ajukan Cuti di kanan, layout konsisten */}
            <Card className="rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="items-center">
                <CardTitle className="text-green-700 flex flex-col items-center gap-2"><Calendar className="w-8 h-8 mb-2" />Ajukan Cuti</CardTitle>
                <CardDescription className="text-center">Buat pengajuan cuti atau izin</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-3 rounded-lg shadow transition" style={{ fontSize: '1.1rem' }} onClick={handleAjukanCuti}>
                  Ajukan Cuti
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 border-purple-100 rounded-xl cursor-pointer bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-col items-center">
                <Clock className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle className="text-lg font-bold text-center">Riwayat Absensi</CardTitle>
                <CardDescription className="text-gray-500 text-center">Lihat history kehadiran Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg" onClick={handleRiwayatAbsensi}>
                  Lihat Riwayat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 border-orange-100 rounded-xl cursor-pointer bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle className="text-lg font-bold text-center">Slip Gaji</CardTitle>
                <CardDescription className="text-gray-500 text-center">Download slip gaji bulanan</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg" onClick={handleOpenSlipGajiDialog}>
                  Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 border-blue-100 rounded-xl cursor-pointer bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-col items-center">
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg font-bold text-center">Riwayat Izin/Sakit</CardTitle>
                <CardDescription className="text-gray-500 text-center">Lihat pengajuan izin/sakit Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" onClick={() => setIzinListOpen(true)}>
                  Lihat Riwayat Izin/Sakit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Profile Dialog */}
      <EmployeeProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
        profile={profile} 
      />

      {/* Izin/Sakit Dialog */}
      <Dialog open={izinDialogOpen} onOpenChange={setIzinDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajukan Izin/Sakit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIzinSubmit} className="space-y-4">
            <div>
              <Label htmlFor="izin_tanggal">Tanggal</Label>
              <Input type="date" id="izin_tanggal" value={izinForm.tanggal} onChange={e => setIzinForm(f => ({ ...f, tanggal: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="izin_jenis">Jenis</Label>
              <select id="izin_jenis" value={izinForm.jenis} onChange={e => setIzinForm(f => ({ ...f, jenis: e.target.value }))} required className="border rounded px-2 py-1 w-full">
                <option value="">Pilih jenis</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
            </div>
            <div>
              <Label htmlFor="izin_alasan">Alasan</Label>
              <Input id="izin_alasan" value={izinForm.alasan} onChange={e => setIzinForm(f => ({ ...f, alasan: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="izin_file">Upload Foto (jpg/png, max 2MB)</Label>
              <Input type="file" id="izin_file" accept="image/jpeg,image/png" onChange={handleIzinFile} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIzinDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={izinLoading}>{izinLoading ? 'Mengirim...' : 'Ajukan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog daftar izin/sakit */}
      <Dialog open={izinListOpen} onOpenChange={setIzinListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Pengajuan Izin/Sakit</DialogTitle>
          </DialogHeader>
          <IzinSakitList employeeId={profile?.id} />
        </DialogContent>
      </Dialog>

      {/* Dialog Notifikasi */}
      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Notifikasi Status Pengajuan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            {unreadCount === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada notifikasi baru
              </div>
            ) : (
              unreadNotifications.map((request, index) => {
                const isApproved = request.status === 'APPROVED';
                const isRejected = request.status === 'REJECTED';
                
                return (
                  <div key={index} className={`border p-4 rounded-lg hover:bg-opacity-80 transition-colors cursor-pointer ${
                    isApproved 
                      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                      : isRejected 
                        ? 'border-red-200 bg-red-50 hover:bg-red-100'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`} onClick={() => handleNotificationClick(request)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-2 ${
                          isApproved ? 'text-green-800' : isRejected ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          Pengajuan {request.request_type === 'izin_sakit' ? 'Izin/Sakit' : 'Cuti'} {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Diproses'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          {request.start_date && request.end_date && request.start_date !== request.end_date && (
                            <p><strong>Tanggal:</strong> {new Date(request.start_date).toLocaleDateString('id-ID')} - {new Date(request.end_date).toLocaleDateString('id-ID')}</p>
                          )}
                          <p><strong>Jenis:</strong> {request.leave_type}</p>
                          {request.reason && (
                            <p><strong>Alasan:</strong> {request.reason}</p>
                          )}
                          {isRejected && request.rejection_reason && (
                            <p><strong>Alasan Penolakan:</strong> <span className="text-red-600">{request.rejection_reason}</span></p>
                          )}
                          <p><strong>{isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Diproses'} pada:</strong> {new Date(request.approved_at || request.rejected_at || request.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isApproved 
                            ? 'bg-green-100 text-green-800' 
                            : isRejected 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Diproses'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Download Slip Gaji */}
      <Dialog open={slipGajiDialogOpen} onOpenChange={setSlipGajiDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Download Slip Gaji
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingPayrolls ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-sm text-gray-500">Memuat data payroll...</p>
              </div>
            ) : availablePayrolls.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada slip gaji yang tersedia</p>
                <p className="text-sm text-gray-400 mt-1">Slip gaji akan tersedia setelah HRD melakukan input payroll</p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="payment_date">Pilih Tanggal Pembayaran</Label>
                  <Select value={selectedPayrollId} onValueChange={setSelectedPayrollId}>
                    <SelectTrigger id="payment_date" className="w-full">
                      <SelectValue placeholder="Pilih tanggal pembayaran..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePayrolls.map((payroll) => (
                        <SelectItem key={payroll.id} value={payroll.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(payroll.payment_date), 'dd MMMM yyyy', { locale: id })}
                            </span>
                            <span className="text-xs text-gray-500">
                              Periode: {format(new Date(payroll.pay_period_start), 'dd/MM/yy')} - {format(new Date(payroll.pay_period_end), 'dd/MM/yy')}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPayrollId && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Detail Slip Gaji</h4>
                    {(() => {
                      const selected = availablePayrolls.find(p => p.id === selectedPayrollId);
                      return selected ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Periode:</span>
                            <span className="font-medium">
                              {format(new Date(selected.pay_period_start), 'dd MMM', { locale: id })} - {format(new Date(selected.pay_period_end), 'dd MMM yyyy', { locale: id })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Gaji Bersih:</span>
                            <span className="font-bold text-green-600">
                              Rp {Number(selected.net_salary || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <span className={`font-medium ${selected.status === 'PAID' ? 'text-green-600' : 'text-blue-600'}`}>
                              {selected.status === 'PAID' ? 'Dibayar' : 'Disetujui'}
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSlipGajiDialogOpen(false);
                setSelectedPayrollId('');
              }}
            >
              Batal
            </Button>
            <Button 
              onClick={handleDownloadSlipGaji}
              disabled={!selectedPayrollId || downloadingSlip || loadingPayrolls}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {downloadingSlip ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KaryawanDashboard;
