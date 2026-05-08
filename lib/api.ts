// 🔥 UBAH: Gunakan localhost agar tidak error saat IP Wi-Fi berubah, dan tambahkan 'export'
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetch(endpoint: string, options: RequestInit) {
  let access_token = localStorage.getItem("access_token") || localStorage.getItem("admin_token");

  const noAuthEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh-token",
    "/auth/logout",
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

  let res = await doFetch(access_token);

  // 🔥 HANDLE TOKEN EXPIRED
  if (res.status === 401 && !isNoAuth) {
    const refresh_token = localStorage.getItem("refresh_token") || localStorage.getItem("admin_refresh_token");

    // 🔥 FUNGSI BANTUAN UNTUK LOGOUT PAKSA + NOTIFIKASI
    const forceLogout = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
      sessionStorage.clear();

      // Munculkan notifikasi ke user
      alert("Sesi Anda telah habis. Silakan login kembali untuk melanjutkan.");

      // 🔥 UBAH: Karena ini project khusus Admin, langsung arahkan ke /login
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
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      });

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok) throw new Error();

      const newToken = refreshData.data.access_token;

      // Cek nyimpannya harus sebagai admin_token atau access_token
      if (localStorage.getItem("admin_token")) {
        localStorage.setItem("admin_token", newToken);
      } else {
        localStorage.setItem("access_token", newToken);
      }

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