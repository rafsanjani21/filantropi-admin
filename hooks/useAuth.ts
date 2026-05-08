
import { useState } from "react";
import { useRouter } from "next/navigation";
// Pastikan Anda punya fungsi login untuk admin di AuthService
import { AuthService } from "@/lib/auth.service"; 
import toast from "react-hot-toast";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // FUNGSI KHUSUS LOGIN ADMIN
  const loginAdmin = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Sesuaikan dengan endpoint login admin Anda
      const res = await AuthService.loginAdmin(email);
      
      // Simpan token dengan nama spesifik admin
      localStorage.setItem("admin_token", res.data.access_token);
      localStorage.setItem("admin_refresh_token", res.data.refresh_token);

      toast.success("Berhasil masuk ke Pusat Kendali!");
      router.replace("/"); // Arahkan ke Dashboard Admin

    } catch (err: any) {
      toast.error(err.message || "Gagal login. Periksa kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loginAdmin,
  };
}