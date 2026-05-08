import "./globals.css";
import { Metadata } from "next";
import AdminWrapper from "./AdminWrapper"; // 🔥 Panggil komponen yang baru kita buat

// 🔥 Di sinilah Title dan Description Web Admin Anda diatur
export const metadata: Metadata = {
  title: "Admin Filantropi | Pusat Kendali",
  description: "Dashboard manajemen untuk admin platform Filantropi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased text-gray-900">
        
        {/* Membungkus seluruh aplikasi dengan wrapper interaktif */}
        <AdminWrapper>
          {children}
        </AdminWrapper>

      </body>
    </html>
  );
}