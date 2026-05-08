"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Megaphone,
  Clock,
  User,
  UserCheck,
  ShieldPlus,
  FileText,
  AlertCircle,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  // 🔥 STATE DIPERBARUI SESUAI RESPONSE API BARU
  const [statsData, setStatsData] = useState({
    user_amount: 0,
    unverified_user_amount: 0,
    verified_user_amount: 0,
    beneficiary_amount: 0,
    all_user_amount: 0,
    active_campaigns: 0,
    pending_campaigns: 0,
    all_campaign_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch("/admin/dashboard", { method: "GET" });

        if (res && res.data) {
          setStatsData(res.data);
        } else if (res && res.user_amount !== undefined) {
          setStatsData(res);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* 🔥 WELCOME BANNER */}
      <div className="relative bg-linear-to-r from-purple-700 via-purple-600 to-[#b359d4] rounded-[2rem] p-8 md:p-10 text-white overflow-hidden shadow-lg shadow-purple-200">
        {/* Ornamen Background */}
        <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[10%] w-40 h-40 bg-pink-300 opacity-20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Selamat Datang, Super Admin!
            </h1>
            <p className="text-purple-100 text-sm md:text-base max-w-xl leading-relaxed">
              Ini adalah ringkasan performa platform filantropi Anda hari ini.
              Kelola kampanye, pantau pengguna, dan pastikan kelancaran verifikasi.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-purple-600 font-bold animate-pulse tracking-wide">
            Menyinkronkan Data Server...
          </p>
        </div>
      ) : (
        <>
          {/* 🔥 STATS GRID 1: SOROTAN KAMPANYE & TINJAUAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Kampanye */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <LayoutDashboard
                className="absolute -bottom-4 -right-4 text-blue-50 opacity-50 transform group-hover:scale-110 transition-transform duration-500"
                size={100}
              />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                  <FileText size={24} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Total Kampanye
                </p>
                <h3 className="text-2xl font-black text-gray-800 mb-2">
                  {statsData.all_campaign_amount}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md w-max">
                  Seluruh program terdaftar
                </div>
              </div>
            </div>

            {/* Card 2: Kampanye Aktif */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <Megaphone
                className="absolute -bottom-4 -right-4 text-purple-50 opacity-50 transform group-hover:scale-110 transition-transform duration-500"
                size={100}
              />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
                  <Megaphone size={24} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Kampanye Aktif
                </p>
                <h3 className="text-2xl font-black text-gray-800 mb-2">
                  {statsData.active_campaigns}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-md w-max">
                  Berjalan di platform
                </div>
              </div>
            </div>

            {/* Card 3: Menunggu Verifikasi Kampanye */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <Clock
                className="absolute -bottom-4 -right-4 text-orange-50 opacity-50 transform group-hover:scale-110 transition-transform duration-500"
                size={100}
              />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Tinjauan Kampanye
                </p>
                <h3 className="text-2xl font-black text-gray-800 mb-2">
                  {statsData.pending_campaigns}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-max border border-orange-100">
                  {statsData.pending_campaigns > 0 ? "Perlu aksi segera" : "Semua bersih"}
                </div>
              </div>
            </div>

            {/* Card 4: Menunggu Verifikasi User */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <AlertCircle
                className="absolute -bottom-4 -right-4 text-rose-50 opacity-50 transform group-hover:scale-110 transition-transform duration-500"
                size={100}
              />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle size={24} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Akun Unverified
                </p>
                <h3 className="text-2xl font-black text-gray-800 mb-2">
                  {statsData.unverified_user_amount}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md w-max">
                  Menunggu approval
                </div>
              </div>
            </div>

          </div>

          {/* 🔥 STATS GRID 2: STATISTIK PENGGUNA TERPERINCI */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <ShieldPlus className="text-purple-600" size={22} /> Statistik Pengguna
              </h2>
              <Link
                href="/users"
                className="text-sm font-bold text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl transition-colors"
              >
                Kelola Pengguna
              </Link>
            </div>

            {/* Dibagi jadi 4 kolom agar lebih pas dengan data baru */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x divide-gray-100">
              
              {/* Total Seluruh Akun */}
              <div className="flex items-center gap-5 lg:pl-0">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Total Akun
                  </p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {statsData.all_user_amount}
                  </h3>
                </div>
              </div>

              {/* Penerima Manfaat */}
              <div className="flex items-center gap-5 lg:pl-8">
                <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Penerima Manfaat
                  </p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {statsData.beneficiary_amount}
                  </h3>
                </div>
              </div>

              {/* Donatur Biasa */}
              <div className="flex items-center gap-5 lg:pl-8">
                <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Donatur Terdaftar
                  </p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {statsData.user_amount}
                  </h3>
                </div>
              </div>

              {/* Akun Terverifikasi */}
              <div className="flex items-center gap-5 lg:pl-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Terverifikasi
                  </p>
                  <h3 className="text-3xl font-black text-gray-800">
                    {statsData.verified_user_amount}
                  </h3>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}