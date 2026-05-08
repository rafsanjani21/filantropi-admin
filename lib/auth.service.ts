
import { apiFetch } from "./api";

export const AuthService = {
  // 1. LOGIN KHUSUS ADMIN MENGGUNAKAN GOOGLE ID_TOKEN
  async loginAdmin(id_token: string) {
    return apiFetch("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ id_token }),
    });
  },

  // 2. GET PROFIL ADMIN (Opsional)
  async getAdminProfile() {
    return apiFetch("/admin/profile", {
      method: "GET",
    });
  },
};