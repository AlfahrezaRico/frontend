import { useAuthContext } from "@/hooks/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardRedirect() {
  const { role } = useAuthContext();
  const navigate = useNavigate();
  useEffect(() => {
    if (role === "superadmin") navigate("/dashboard/superadmin", { replace: true });
    else if (role === "hrd") navigate("/dashboard/hrd", { replace: true });
    else if (role === "karyawan") navigate("/dashboard/karyawan", { replace: true });
    else navigate("/", { replace: true });
  }, [role, navigate]);
  return null;
} 