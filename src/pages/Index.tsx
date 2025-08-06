
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Shield, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useContext } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      setRegisterError("Semua field wajib diisi");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Password dan konfirmasi password tidak sama");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error || "Registrasi gagal");
      } else {
        setRegisterSuccess("Registrasi berhasil, silakan login.");
        setShowRegister(false);
      }
    } catch (err) {
      setRegisterError("Registrasi gagal, server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">HRIS KSP Mekarsari</h1>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Human Resource Information System
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Kelola karyawan, absensi, cuti, dan data HR lainnya dalam satu platform yang mudah digunakan
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate("/login")}
          >
            Mulai Sekarang
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Fitur Unggulan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Manajemen Karyawan</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Kelola data karyawan, struktur organisasi, dan informasi personal secara terpusat
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Manajemen Cuti</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Proses pengajuan cuti dan izin yang mudah dengan approval workflow
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Laporan Otomatis</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Generate laporan HR otomatis untuk keperluan administratif dan compliance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">Role-Based Access</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Kontrol akses berdasarkan role: SuperAdmin, HRD, dan Karyawan
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 mr-2 text-blue-400" />
            <span className="text-lg font-semibold">HRIS KSP Mekarsari</span>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            © 2024 HRIS KSP Mekarsari. Human Resource Information System By Rico Aulia Fahreza.
          </p>
        </div>
      </footer>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Registrasi Akun Baru</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                <input 
                  type="text" 
                  name="name" 
                  value={registerData.name} 
                  onChange={handleRegisterChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={registerData.email} 
                  onChange={handleRegisterChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={registerData.password} 
                  onChange={handleRegisterChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={registerData.confirmPassword} 
                  onChange={handleRegisterChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {registerError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{registerError}</div>
              )}
              {registerSuccess && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{registerSuccess}</div>
              )}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowRegister(false)} 
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Mendaftar..." : "Daftar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
