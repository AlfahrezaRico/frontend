import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, BarChart3, TrendingUp, Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SystemReports = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 1,
      title: "Laporan Aktivitas Pengguna",
      description: "Data login dan aktivitas semua pengguna sistem",
      type: "User Activity",
      lastGenerated: "2024-01-02 10:30",
      status: "Available",
      icon: Users
    },
    {
      id: 2,
      title: "Laporan Performa Sistem",
      description: "Metrik performa database dan aplikasi",
      type: "System Performance",
      lastGenerated: "2024-01-02 09:00",
      status: "Available",
      icon: TrendingUp
    },
    {
      id: 3,
      title: "Laporan Keamanan",
      description: "Log keamanan dan anomali sistem",
      type: "Security",
      lastGenerated: "2024-01-02 08:15",
      status: "Available",
      icon: FileText
    },
    {
      id: 4,
      title: "Laporan Backup Database",
      description: "Status dan riwayat backup database",
      type: "Database",
      lastGenerated: "2024-01-02 02:00",
      status: "Available",
      icon: BarChart3
    },
    {
      id: 5,
      title: "Laporan Bulanan Sistem",
      description: "Ringkasan aktivitas sistem bulan lalu",
      type: "Monthly Summary",
      lastGenerated: "2024-01-01 23:59",
      status: "Generating",
      icon: Calendar
    }
  ];

  const getStatusBadge = (status: string) => {
    return status === "Available" ? (
      <Badge variant="default">Tersedia</Badge>
    ) : (
      <Badge variant="secondary">Generating...</Badge>
    );
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
                <h1 className="text-xl font-bold text-gray-900">System Reports</h1>
                <p className="text-sm text-gray-500">Laporan dan analytics sistem</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">DB Size</p>
                    <p className="text-2xl font-bold text-gray-900">2.4GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-md">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Backup</p>
                    <p className="text-2xl font-bold text-gray-900">2h ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Laporan Sistem</CardTitle>
              <CardDescription>Generate dan download laporan sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-md">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{report.title}</h3>
                          <p className="text-sm text-gray-500">{report.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{report.type}</Badge>
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Terakhir dibuat</p>
                          <p className="text-sm font-medium">{report.lastGenerated}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={report.status !== "Available"}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-4">Generate Custom Report</h3>
                <div className="flex space-x-2">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate User Report
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate System Report
                  </Button>
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Generate Performance Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default SystemReports;