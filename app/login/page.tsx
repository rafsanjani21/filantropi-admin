"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LockKeyhole, AlertCircle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// 🔥 Import Firebase bawaan Anda
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

// 🔥 IMPORT AuthService
import { AuthService } from "@/lib/auth.service";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGoogleAuth = async () => {
    setMessage("");
    setIsLoading(true);

    try {
      // 1. Dapatkan id_token dari Firebase
      const result = await signInWithPopup(auth, provider);
      const id_token = await result.user.getIdToken();

      // 2. Tembak API Admin Login lewat AuthService
      const data = await AuthService.loginAdmin(id_token);

      // 3. Simpan Token dengan penamaan KHUSUS ADMIN
      const accessToken = data.data?.access_token || data.token || data.access_token;
      const refreshToken = data.data?.refresh_token || data.refresh_token;

      if (accessToken) {
        // 🔥 UBAH: Simpan sebagai admin_token
        localStorage.setItem("admin_token", accessToken);
        // Simpan juga ke Cookie dengan nama admin_token
        document.cookie = `admin_token=${accessToken}; path=/; max-age=86400;`; 
      }
      
      if (refreshToken) {
        // 🔥 UBAH: Simpan sebagai admin_refresh_token
        localStorage.setItem("admin_refresh_token", refreshToken);
      }

      toast.success("Otorisasi berhasil. Membuka Pusat Kendali...");
      router.push("/");

    } catch (error: any) {
      console.error("Admin Login Error:", error);
      // Hapus sesi Google jika login gagal agar bisa pilih akun lagi
      auth.signOut(); 
      setMessage(error.message || "Gagal terhubung atau Anda bukan Administrator.");
      toast.error("Otorisasi gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-t from-[#7C3996] to-[#b359d4] relative overflow-hidden">
      
      {/* Background Ornamen */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md p-8 md:p-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 m-4 z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center mb-10 text-purple-700">
          <div className="w-24 h-24 flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
            <Image 
              src="/logo.png" 
              alt="Logo Filantropi" 
              width={96} 
              height={96} 
              className="object-contain drop-shadow-md"
              priority 
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">Filantropi<span className="text-purple-600">.</span></h1>
          <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase mt-1 flex items-center gap-1">
            <ShieldCheck size={14} className="text-purple-500" /> Pusat Kendali Admin
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-gray-800">Otorisasi Sistem</h2>
            <p className="text-sm text-gray-500">Silakan verifikasi identitas Anda menggunakan kredensial Google Workspace.</p>
          </div>

          {/* PESAN ERROR */}
          {message && (
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 text-sm bg-red-50 text-red-600 border border-red-100 animate-in fade-in zoom-in duration-300">
              <AlertCircle size={18} className="shrink-0" />
              <span className="font-medium">{message}</span>
            </div>
          )}

          {/* TOMBOL LOGIN GOOGLE */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="group relative w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl font-bold text-gray-700 transition-all duration-300 hover:border-purple-500 hover:text-purple-700 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm md:text-base text-purple-600">Memverifikasi Otoritas...</span>
              </>
            ) : (
              <>
                <Image src="/google.png" alt="Google" width={24} height={24} className="w-6 h-6" />
                <span className="text-sm md:text-base">Lanjutkan sebagai Admin</span>
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-start gap-3">
            <LockKeyhole className="text-purple-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-tighter">
              Sistem Keamanan Terenkripsi <br/> Akses Terbatas untuk Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}