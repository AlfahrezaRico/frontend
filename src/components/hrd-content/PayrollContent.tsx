import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Settings, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export const PayrollContent = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    totalAmount: 0,
    avgSalary: 0
  });

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payrolls`);
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
        
        // Calculate stats
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthPayrolls = data.filter((p: any) => {
          const payrollDate = new Date(p.pay_period_start);
          return payrollDate.getMonth() === thisMonth && payrollDate.getFullYear() === thisYear;
        });
        
        const totalAmount = data.reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
        const avgSalary = data.length > 0 ? totalAmount / data.length : 0;
        
        setStats({
          total: data.length,
          thisMonth: thisMonthPayrolls.length,
          totalAmount,
          avgSalary
        });
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount).replace('IDR', 'Rp').trim();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Management Payroll</h2>
          <p className="text-gray-600">Kelola data gaji dan pembayaran karyawan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Konfigurasi
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Payroll
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Records payroll</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Payroll processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Total amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Gaji</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgSalary)}</div>
            <p className="text-xs text-muted-foreground">Average salary</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payrolls */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Terbaru</CardTitle>
          <CardDescription>Daftar payroll yang baru diproses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data payroll
            </div>
          ) : (
            <div className="space-y-4">
              {payrolls.slice(0, 5).map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {payroll.employee?.first_name} {payroll.employee?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {payroll.pay_period_start} - {payroll.pay_period_end}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payroll.net_salary)}</div>
                    <div className={`text-sm ${payroll.status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                      {payroll.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};