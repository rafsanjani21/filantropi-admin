"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Megaphone, LogOut, Menu, FileText 
} from "lucide-react";
import { Toaster } from 'react-hot-toast';

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  const menuItems = [
    { name: "Overview", icon: <LayoutDashboard size={20} />, path: "/" },
    { name: "Verifikasi User", icon: <Users size={20} />, path: "/users" },
    { name: "Kelola Kampanye", icon: <Megaphone size={20} />, path: "/campaigns" },
    { name: "Laporan & Pencairan", icon: <FileText size={20} />, path: "/reports" },
  ];

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token") || localStorage.getItem("admin_refresh_token");

      // 🔥 UBAH: Ambil BASE_URL dari .env.local
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (refreshToken) {
        const res = await fetch(`${BASE_URL}/admin/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(adminToken ? { "Authorization": `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (!res.ok && res.status !== 401) {
          console.warn(`API Logout gagal dengan status: ${res.status}`);
        }
      }
    } catch (error) {
      console.error("Gagal terhubung ke API Logout:", error);
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token"); 
      localStorage.removeItem("admin_refresh_token"); 
      sessionStorage.clear(); 
      
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      router.replace("/login");
    }
  };

  // 🔥 Jika halaman login, langsung return konten saja (tanpa sidebar)
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // 🔥 Jika bukan login, tampilkan layout admin lengkap
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster /> 
      
      {/* MODAL POPUP LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl flex flex-col items-center p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-red-100 shadow-inner">
              <LogOut size={36} className="ml-1" /> 
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Konfirmasi Keluar</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi dan keluar dari Pusat Kendali Admin?
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="w-1/2 flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3.5 rounded-2xl hover:bg-red-600 active:scale-95 transition-all shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Ya, Keluar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* LOGO AREA */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 px-4">
          <Link href="/" className="block transform hover:scale-105 transition-transform duration-300 cursor-pointer">
            <div 
              className="w-[160px] h-[45px] bg-purple-700"
              style={{
                WebkitMaskImage: 'url(/filantropi.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
                maskImage: 'url(/filantropi.png)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center'
              }}
            />
          </Link>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} href={item.path} onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all ${
                  isActive ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                {item.icon} <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => { setIsSidebarOpen(false); setShowLogoutModal(true); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={20} /> <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 lg:justify-end">
          <button className="lg:hidden p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">Super Admin</p>
              <p className="text-xs text-gray-500">Pusat Kendali</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center font-bold text-purple-700 shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}