import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth.service";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // FUNGSI PINTAR: Mengatur alur Login & Pendaftaran User Baru
  const smartAuth = async (id_token: string, name: string, fallbackRole: string) => {
    try {
      setLoading(true);

      try {
        // ==========================================
        // 1. COBA LOGIN (UNTUK USER YANG SUDAH ADA)
        // ==========================================
        const res = await AuthService.login(id_token);
        
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);
        sessionStorage.removeItem("selected_role");

        router.replace("/"); 

      } catch (err: any) {
        // ==========================================
        // 2. JIKA GAGAL (USER BARU / BELUM TERDAFTAR)
        // ==========================================
        if (err.message.includes("user not found") || err.message.includes("belum terdaftar")) {
          
          // Tahan pendaftaran! Simpan id_token sementara
          sessionStorage.setItem("id_token", id_token); 
          sessionStorage.setItem("temp_name", name); // Simpan nama dari Google
          
          if (fallbackRole === "penerima_manfaat") {
             // ---> PENERIMA MANFAAT BARU <---
             router.replace("/ProfilePage/PagePenerima/Tipe"); 
          } else {
             // ---> PENGGUNA UMUM BARU <---
             // Arahkan ke form profil agar dia melengkapi Wallet dulu
             router.replace("/ProfilePage/UserPage");
          }

        } else {
          throw err;
        }
      }

    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const refresh_token = localStorage.getItem("refresh_token");
      if (refresh_token) {
        try {
          await AuthService.logout(refresh_token);
        } catch (err) {
          console.warn("Logout API gagal (diabaikan)");
        }
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      sessionStorage.clear(); 
      window.location.href = "/LoginPage";
    }
  };

  const getProfile = async (type: "donor" | "beneficiary" = "donor") => {
    try {
      const res = await AuthService.getProfile(type);
      return res.data;
    } catch (err: any) {
      if (err.message.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("access_token");
        window.location.href = "/LoginPage";
      }
      throw err;
    }
  };

  const updateProfile = async (formData: FormData, role: string) => {
    try {
      setLoading(true);
      return await AuthService.updateProfile(formData, role);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (formData: FormData) => {
    try {
      setLoading(true);
      return await AuthService.createCampaign(formData);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    smartAuth,
    handleLogout,
    getProfile,
    updateProfile,
    createCampaign,
  };
}