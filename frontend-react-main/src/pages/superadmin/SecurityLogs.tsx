import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Shield, AlertTriangle, User, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SecurityLogs = () => {
  const navigate = useNavigate();

  const securityLogs = [
    {
      id: 1,
      timestamp: "2024-01-02 14:30:25",
      event: "LOGIN_SUCCESS",
      user: "admin@company.com",
      ip: "192.168.1.100",
      userAgent: "Chrome 120.0.0 (Windows)",
      severity: "INFO",
      details: "Successful login from trusted IP"
    },
    {
      id: 2,
      timestamp: "2024-01-02 14:25:10",
      event: "LOGIN_FAILED",
      user: "unknown@test.com",
      ip: "45.123.45.67",
      userAgent: "Python-requests/2.28.1",
      severity: "WARNING",
      details: "Failed login attempt - user not found"
    },
    {
      id: 3,
      timestamp: "2024-01-02 14:20:05",
      event: "PASSWORD_CHANGE",
      user: "hrd@company.com",
      ip: "192.168.1.101",
      userAgent: "Firefox 120.0 (macOS)",
      severity: "INFO",
      details: "Password successfully changed"
    },
    {
      id: 4,
      timestamp: "2024-01-02 14:15:30",
      event: "ADMIN_ACCESS",
      user: "admin@company.com",
      ip: "192.168.1.100",
      userAgent: "Chrome 120.0.0 (Windows)",
      severity: "INFO",
      details: "Accessed user management panel"
    },
    {
      id: 5,
      timestamp: "2024-01-02 14:10:45",
      event: "MULTIPLE_LOGIN_ATTEMPTS",
      user: "test@test.com",
      ip: "123.45.67.89",
      userAgent: "Automated Bot",
      severity: "CRITICAL",
      details: "5 failed login attempts in 2 minutes"
    },
    {
      id: 6,
      timestamp: "2024-01-02 14:05:20",
      event: "LOGOUT",
      user: "employee@company.com",
      ip: "192.168.1.102",
      userAgent: "Safari 17.0 (iOS)",
      severity: "INFO",
      details: "User logged out successfully"
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive">Critical</Badge>;
      case "WARNING":
        return <Badge variant="secondary">Warning</Badge>;
      case "INFO":
        return <Badge variant="default">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEventIcon = (event: string) => {
    if (event.includes("LOGIN")) return <User className="h-4 w-4" />;
    if (event.includes("PASSWORD")) return <Lock className="h-4 w-4" />;
    if (event.includes("ACCESS") || event.includes("LOGOUT")) return <Eye className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

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
                <h1 className="text-xl font-bold text-gray-900">Security Logs</h1>
                <p className="text-sm text-gray-500">Monitor aktivitas keamanan sistem</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-md">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Warnings (24h)</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-md">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical (24h)</p>
                    <p className="text-2xl font-bold text-gray-900">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                    <p className="text-2xl font-bold text-gray-900">7</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Log Keamanan</CardTitle>
                  <CardDescription>Aktivitas keamanan terbaru dalam sistem</CardDescription>
                </div>
                <Button variant="outline">
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Cari berdasarkan user, IP, atau event..." className="pl-10" />
                </div>
                <Button variant="outline">Filter</Button>
              </div>

              {/* Logs Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEventIcon(log.event)}
                          <span className="font-medium">{log.event}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing 6 of 247 security events
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Security Alerts
              </CardTitle>
              <CardDescription>Peringatan keamanan yang memerlukan perhatian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">Multiple Failed Login Attempts</h4>
                    <p className="text-sm text-red-700">IP 123.45.67.89 telah melakukan 5 percobaan login gagal dalam 2 menit.</p>
                    <p className="text-xs text-red-600 mt-1">Detected: 2024-01-02 14:10:45</p>
                  </div>
                  <Button size="sm" variant="outline">Block IP</Button>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">Unusual Login Location</h4>
                    <p className="text-sm text-yellow-700">Login dari lokasi yang tidak biasa terdeteksi untuk user admin@company.com.</p>
                    <p className="text-xs text-yellow-600 mt-1">Detected: 2024-01-02 13:45:12</p>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default SecurityLogs;