import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Database, Shield, Mail, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

const SystemConfiguration = () => {
  const navigate = useNavigate();
  const { settings, loading, updateSetting } = useSystemSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
  };

  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    timezone: '',
    work_hours: '',
    auto_backup: false,
    maintenance_mode: false,
    backup_time: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    email_notification: false,
    session_timeout: '',
    max_attempts: '',
    two_factor: false,
  });

  // Isi form setelah settings ready
  useEffect(() => {
    if (!settings) return;
    setForm({
    company_name: getSetting('company_name'),
    company_email: getSetting('company_email'),
    timezone: getSetting('timezone'),
    work_hours: getSetting('work_hours'),
    auto_backup: getSetting('auto_backup') === 'true',
    maintenance_mode: getSetting('maintenance_mode') === 'true',
    backup_time: getSetting('backup_time'),
    smtp_host: getSetting('smtp_host'),
    smtp_port: getSetting('smtp_port'),
    smtp_user: getSetting('smtp_user'),
    smtp_pass: getSetting('smtp_pass'),
    email_notification: getSetting('email_notification') === 'true',
    session_timeout: getSetting('session_timeout'),
    max_attempts: getSetting('max_attempts'),
    two_factor: getSetting('two_factor') === 'true',
  });
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simpan semua setting ke database
      await Promise.all([
        updateSetting('company_name', form.company_name),
        updateSetting('company_email', form.company_email),
        updateSetting('timezone', form.timezone),
        updateSetting('work_hours', form.work_hours),
        updateSetting('auto_backup', form.auto_backup ? 'true' : 'false'),
        updateSetting('maintenance_mode', form.maintenance_mode ? 'true' : 'false'),
        updateSetting('backup_time', form.backup_time),
        updateSetting('smtp_host', form.smtp_host),
        updateSetting('smtp_port', form.smtp_port),
        updateSetting('smtp_user', form.smtp_user),
        updateSetting('smtp_pass', form.smtp_pass),
        updateSetting('email_notification', form.email_notification ? 'true' : 'false'),
        updateSetting('session_timeout', form.session_timeout),
        updateSetting('max_attempts', form.max_attempts),
        updateSetting('two_factor', form.two_factor ? 'true' : 'false'),
      ]);
      toast({
        title: "Settings Saved",
        description: "System configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

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
                onClick={() => navigate('/dashboard/superadmin')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-sm text-gray-500">Pengaturan sistem global</p>
              </div>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Pengaturan Umum
              </CardTitle>
              <CardDescription>Konfigurasi dasar sistem HRIS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nama Perusahaan</Label>
                  <Input id="company-name" value={form.company_name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email Perusahaan</Label>
                  <Input id="company-email" type="email" value={form.company_email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Waktu</Label>
                  <Input id="timezone" value={form.timezone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-hours">Jam Kerja Standar</Label>
                  <Input id="work-hours" value={form.work_hours} onChange={handleInputChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Pengaturan Database
              </CardTitle>
              <CardDescription>Konfigurasi backup dan maintenance database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup Harian</Label>
                  <p className="text-sm text-gray-500">Backup database otomatis setiap hari</p>
                </div>
                <Switch id="auto_backup" checked={form.auto_backup} onCheckedChange={checked => setForm(f => ({...f, auto_backup: checked}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Aktifkan mode maintenance sistem</p>
                </div>
                <Switch id="maintenance_mode" checked={form.maintenance_mode} onCheckedChange={checked => setForm(f => ({...f, maintenance_mode: checked}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-time">Waktu Backup</Label>
                <Input id="backup-time" type="time" value={form.backup_time} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Pengaturan Email
              </CardTitle>
              <CardDescription>Konfigurasi email notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" value={form.smtp_host} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" value={form.smtp_port} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input id="smtp-user" value={form.smtp_user} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">SMTP Password</Label>
                  <Input id="smtp-pass" type="password" value={form.smtp_pass} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifikasi</Label>
                  <p className="text-sm text-gray-500">Kirim notifikasi email untuk event penting</p>
                </div>
                <Switch id="email_notification" checked={form.email_notification} onCheckedChange={checked => setForm(f => ({...f, email_notification: checked}))} />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pengaturan Keamanan
              </CardTitle>
              <CardDescription>Konfigurasi keamanan dan session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                  <Input id="session-timeout" type="number" value={form.session_timeout} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-attempts">Max Login Attempts</Label>
                  <Input id="max-attempts" type="number" value={form.max_attempts} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Wajibkan 2FA untuk semua admin</p>
                </div>
                <Switch id="two_factor" checked={form.two_factor} onCheckedChange={checked => setForm(f => ({...f, two_factor: checked}))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-gray-500">Log semua aktivitas admin</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default SystemConfiguration;