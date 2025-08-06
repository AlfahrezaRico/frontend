import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import HRDDashboard from "./pages/dashboard/HRDDashboard";
import KaryawanDashboard from "./pages/dashboard/KaryawanDashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import LeaveManagement from "./pages/LeaveManagement";
import HRReports from "./pages/HRReports";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/superadmin/UserManagement";
import SystemConfiguration from "./pages/superadmin/SystemConfiguration";
import SystemReports from "./pages/superadmin/SystemReports";
import DatabaseTools from "./pages/superadmin/DatabaseTools";
import SecurityLogs from "./pages/superadmin/SecurityLogs";
import LeaveQuotaManagement from "./pages/superadmin/LeaveQuotaManagement";
import NIKConfiguration from "./pages/superadmin/NIKConfiguration";
import HRDIzinSakitManagement from './pages/HRDIzinSakitManagement';
import { AuthProvider } from "./hooks/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import { ToastProvider } from "@/hooks/use-toast";
import DashboardRedirect from "./pages/DashboardRedirect";
import PayrollManagement from "./pages/PayrollManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/dashboard/superadmin" element={<RequireAuth allowedRoles={["superadmin"]}><SuperAdminDashboard /></RequireAuth>} />
              <Route path="/dashboard/hrd" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><HRDDashboard /></RequireAuth>} />
              <Route path="/dashboard/karyawan" element={<RequireAuth allowedRoles={["karyawan"]}><KaryawanDashboard /></RequireAuth>} />
              <Route path="/employee-management" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><EmployeeManagement /></RequireAuth>} />
              <Route path="/attendance-management" element={<RequireAuth allowedRoles={["hrd", "superadmin", "karyawan"]}><AttendanceManagement /></RequireAuth>} />
              <Route path="/leave-management" element={<RequireAuth allowedRoles={["hrd", "superadmin", "karyawan"]}><LeaveManagement /></RequireAuth>} />
              <Route path="/hr-reports" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><HRReports /></RequireAuth>} />
              <Route path="/superadmin/users" element={<RequireAuth allowedRoles={["superadmin"]}><UserManagement /></RequireAuth>} />
              <Route path="/superadmin/settings" element={<RequireAuth allowedRoles={["superadmin"]}><SystemConfiguration /></RequireAuth>} />
              <Route path="/superadmin/reports" element={<RequireAuth allowedRoles={["superadmin"]}><SystemReports /></RequireAuth>} />
              <Route path="/superadmin/database" element={<RequireAuth allowedRoles={["superadmin"]}><DatabaseTools /></RequireAuth>} />
              <Route path="/superadmin/logs" element={<RequireAuth allowedRoles={["superadmin"]}><SecurityLogs /></RequireAuth>} />
              <Route path="/superadmin/nik-configuration" element={<RequireAuth allowedRoles={["superadmin"]}><NIKConfiguration /></RequireAuth>} />
              <Route path="/dashboard/hrd/leave-quotas" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><LeaveQuotaManagement /></RequireAuth>} />
              <Route path="/payroll-management" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><PayrollManagement /></RequireAuth>} />
              <Route path="/hrd-izin-sakit-management" element={<RequireAuth allowedRoles={["hrd", "superadmin"]}><HRDIzinSakitManagement /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
