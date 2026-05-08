export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 🔥 KHUSUS ADMIN: Fokus menggunakan admin_token
  let admin_token = localStorage.getItem("admin_token");

  // 🔥 UBAH: Sesuaikan dengan endpoint milik Admin
  const noAuthEndpoints = [
    "/admin/auth/login",
    "/admin/auth/refresh-token",
    "/admin/auth/logout",
  ];

  const isNoAuth = noAuthEndpoints.some((url) => endpoint.includes(url));
  const isFormData = options.body instanceof FormData;

  const doFetch = async (token: string | null) => {
    return fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...( !isFormData && { "Content-Type": "application/json" }),
        ...( !isNoAuth && token
          ? { Authorization: `Bearer ${token}` }
          : {}
        ),
      },
    });
  };

  let res = await doFetch(admin_token);

  // 🔥 HANDLE TOKEN EXPIRED
  if (res.status === 401 && !isNoAuth) {
    // 🔥 KHUSUS ADMIN: Gunakan admin_refresh_token
    const refresh_token = localStorage.getItem("admin_refresh_token");

    // 🔥 FUNGSI BANTUAN UNTUK LOGOUT PAKSA + NOTIFIKASI
    const forceLogout = () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      sessionStorage.clear();

      // Munculkan notifikasi ke user
      alert("Sesi Anda telah habis. Silakan login kembali untuk melanjutkan.");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    };

    // Jika tidak ada refresh token sama sekali
    if (!refresh_token) {
      forceLogout();
      return Promise.reject("Sesi habis");
    }

    try {
      // 🔥 UBAH: Pastikan menembak endpoint refresh-token ADMIN
      const refreshRes = await fetch(`${BASE_URL}/admin/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      });

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok) throw new Error();

      const newToken = refreshData.data.access_token;
      
      // Simpan token baru
      localStorage.setItem("admin_token", newToken);

      // 🔥 retry request dengan token yang baru
      res = await doFetch(newToken);
      
    } catch {
      // 🔥 JIKA REFRESH TOKEN GAGAL/HABIS, EKSEKUSI ALERT & LOGOUT
      forceLogout();
      return Promise.reject("Sesi habis");
    }
  }

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}