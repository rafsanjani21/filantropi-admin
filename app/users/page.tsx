"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  CheckCircle2, XCircle, FileSearch, Clock, 
  ShieldCheck, Ban, UserCheck, AlertTriangle, Search, 
  Building2, User, AlertCircle, ListFilter, ChevronLeft, ChevronRight, X, 
  Mail, Phone, WalletCards, CalendarDays, MapPin, CreditCard, FileText, Briefcase, Image as ImageIcon
} from "lucide-react";
import { apiFetch } from "@/lib/api"; 
import toast from 'react-hot-toast';

export default function VerifyUsersPage() {
  const [activeTab, setActiveTab] = useState<"semua" | "pending" | "verified" | "rejected">("semua");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // STATE UNTUK MODAL APPROVE & REJECT
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveData, setApproveData] = useState<{id: string, name: string} | null>(null);

  // 🔥 STATE BARU UNTUK MODAL DETAIL PENGGUNA (DAN LOADING DETAIL)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false); // State loading khusus detail
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);

  // FETCH LIST PENGGUNA
  const fetchBeneficiaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/admin/users", { method: "GET" });
      const data = res?.data || res;
      if (Array.isArray(data)) setUsersList(data);
      else setUsersList([]);
    } catch (error) {
      toast.error("Gagal menarik data dari server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  // 🔥 FUNGSI BARU: FETCH DETAIL PENGGUNA (HIT API BERDASARKAN ID)
  const fetchUserDetail = async (userId: string) => {
    setIsDetailModalOpen(true); // Buka modal dulu agar user tahu ada respon
    setIsLoadingDetail(true);
    setSelectedUserDetail(null); // Kosongkan data sebelumnya jika ada

    try {
      // Menembak endpoint /admin/users/:id
      const res = await apiFetch(`/admin/users/${userId}`, { method: "GET" });
      const data = res?.data || res;
      setSelectedUserDetail(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menarik detail pengguna dari server.");
      setIsDetailModalOpen(false); // Tutup modal jika gagal
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const submitApprove = async () => {
    if (!approveData) return;
    setIsSubmitting(true);
    const approvePromise = apiFetch(`/admin/verified/${approveData.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_verified: 1 })
    });

    toast.promise(approvePromise, {
      loading: `Memverifikasi ${approveData.name}...`,
      success: <b>Akun {approveData.name} berhasil disetujui!</b>,
      error: <b>Gagal memverifikasi akun.</b>,
    });

    try {
      await approvePromise;
      setIsApproveModalOpen(false);
      setApproveData(null);
      fetchBeneficiaries(); 
      // Jika modal detail sedang terbuka dan ID-nya sama, kita refresh juga detailnya
      if (isDetailModalOpen && selectedUserDetail?.id === approveData.id) {
        fetchUserDetail(approveData.id);
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return toast.error("Alasan penolakan wajib diisi!", { icon: '⚠️' });
    setIsSubmitting(true);
    const rejectPromise = apiFetch(`/admin/verified/${selectedUserId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_verified: 0, reason: rejectReason })
    });

    toast.promise(rejectPromise, {
      loading: 'Mengirim notifikasi penolakan...',
      success: <b>Penolakan berhasil dikirim.</b>,
      error: <b>Gagal menolak akun.</b>,
    });

    try {
      await rejectPromise;
      setIsRejectModalOpen(false);
      setRejectReason("");
      fetchBeneficiaries();
      // Refresh modal detail jika sedang terbuka untuk ID yang sama
      if (isDetailModalOpen && selectedUserDetail?.id === selectedUserId) {
        fetchUserDetail(selectedUserId!);
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const searchedUsers = usersList.filter((user) => {
    const name = (user.full_name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const pendingUsers = searchedUsers.filter(user => {
    if ((user.role || "").toLowerCase() === "user") return false; 
    const isRejected = user.status?.toLowerCase() === 'rejected' || !!user.reason || !!user.reject_reason;
    return user.is_verified === false && !isRejected;
  });

  const verifiedUsers = searchedUsers.filter(user => {
    if ((user.role || "").toLowerCase() === "user") return true; 
    return user.is_verified === true;
  });

  const rejectedUsers = searchedUsers.filter(user => {
    if ((user.role || "").toLowerCase() === "user") return false; 
    const isRejected = user.status?.toLowerCase() === 'rejected' || !!user.reason || !!user.reject_reason;
    return user.is_verified === false && isRejected;
  });

  let activeDataList = [];
  if (activeTab === "semua") activeDataList = searchedUsers;
  else if (activeTab === "pending") activeDataList = pendingUsers;
  else if (activeTab === "verified") activeDataList = verifiedUsers;
  else if (activeTab === "rejected") activeDataList = rejectedUsers;

  const totalPages = Math.ceil(activeDataList.length / itemsPerPage) || 1;
  const paginatedData = activeDataList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderBeneficiaryType = (type: string | undefined) => {
    if (!type) return null;
    const isLembaga = type.toLowerCase() === "lembaga" || type.toLowerCase() === "organization" || type.toLowerCase() === "organisasi";
    if (isLembaga) return <span className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 w-max"><Building2 size={10} /> Lembaga</span>;
    return <span className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 w-max"><User size={10} /> Individu</span>;
  };

  const renderStatusBadge = (user: any) => {
    const isUmum = (user.role || "").toLowerCase() === "user";
    const isRejected = user.status?.toLowerCase() === 'rejected' || !!user.reason || !!user.reject_reason;

    if (isUmum) {
      return <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-600 border-gray-200 w-max"><ShieldCheck size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Auto-Verified</span></div>;
    } else if (user.is_verified === true) {
      return <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 border-green-200 w-max"><UserCheck size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Verified</span></div>;
    } else if (isRejected) {
      return <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border bg-red-50 text-red-600 border-red-200 w-max"><XCircle size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Ditolak</span></div>;
    } else {
      return <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border bg-orange-50 text-orange-600 border-orange-200 w-max"><Clock size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Menunggu</span></div>;
    }
  };

  const getImageUrl = (path: string) => {
    if (!path || path === "-") return null;
    if (path.startsWith("http")) return path;
    
    // 🔥 FIX: Jangan hapus kata 'public/'. 
    // Cukup pastikan tidak ada double slash (garis miring ganda) di awal path.
    return `${BASE_URL}/${path.replace(/^\/+/, '')}?t=${Date.now()}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 relative">
      
      {/* 🔥 MODAL DETAIL PENGGUNA BARU */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">Detail Lengkap Pengguna</h3>
                  <p className="text-[10px] font-mono text-gray-400">ID: {selectedUserDetail?.id || "Memuat..."}</p>
                </div>
              </div>
              <button 
                onClick={() => {setIsDetailModalOpen(false); setSelectedUserDetail(null);}} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🔥 JIKA SEDANG LOADING, TAMPILKAN SPINNER */}
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-20 flex-1">
                <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-purple-600 font-bold animate-pulse">Menarik detail dari server...</p>
              </div>
            ) : selectedUserDetail ? (
              /* Body Modal (Scrollable) - TAMPIL JIKA DATA SUDAH ADA */
              <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                
                {/* BAGIAN 1: PROFIL UTAMA */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {getImageUrl(selectedUserDetail.photo_profile) ? (
                    <img 
                      src={getImageUrl(selectedUserDetail.photo_profile)!} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-gray-50 shadow-sm shrink-0"
                      onError={(e) => { e.currentTarget.src = "/profile.png" }}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl border-4 border-gray-50 bg-gray-100 text-gray-300 flex items-center justify-center shadow-sm shrink-0">
                      <User size={40} />
                    </div>
                  )}
                  
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <h4 className="text-2xl font-black text-gray-800">{selectedUserDetail.full_name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                            Role: {selectedUserDetail.role}
                          </span>
                          {selectedUserDetail.role.toLowerCase() === "beneficiary" && renderBeneficiaryType(selectedUserDetail.beneficiary_type)}
                        </div>
                      </div>
                      <div>{renderStatusBadge(selectedUserDetail)}</div>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 2: KONTAK & INFORMASI DASAR */}
                <div>
                  <h5 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Kontak & Keanggotaan</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-400 mb-1"><Mail size={14} /> <span className="text-[10px] font-bold uppercase">Email</span></div>
                      <p className="text-sm font-medium text-gray-800 truncate">{selectedUserDetail.email || "-"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-400 mb-1"><Phone size={14} /> <span className="text-[10px] font-bold uppercase">Telepon</span></div>
                      <p className="text-sm font-medium text-gray-800">{selectedUserDetail.phone_number || "-"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 md:col-span-2">
                      <div className="flex items-center gap-2 text-gray-400 mb-1"><WalletCards size={14} /> <span className="text-[10px] font-bold uppercase">Wallet Address (FCC)</span></div>
                      <p className="text-sm font-mono text-purple-700 font-bold break-all">{selectedUserDetail.wallet_address || "Belum diatur"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 md:col-span-2">
                      <div className="flex items-center gap-2 text-gray-400 mb-1"><CalendarDays size={14} /> <span className="text-[10px] font-bold uppercase">Tanggal Bergabung</span></div>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedUserDetail.created_at ? new Date(selectedUserDetail.created_at).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "long" }) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BAGIAN 3: DATA PRIBADI / ORGANISASI */}
                {selectedUserDetail.role.toLowerCase() === "beneficiary" && (
                  <div>
                    <h5 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Informasi Profil & Legalitas</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 md:col-span-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-1"><MapPin size={14} /> <span className="text-[10px] font-bold uppercase">Alamat Lengkap</span></div>
                        <p className="text-sm font-medium text-gray-800">{selectedUserDetail.alamat || "-"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 md:col-span-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-1"><FileText size={14} /> <span className="text-[10px] font-bold uppercase">Deskripsi / Bio</span></div>
                        <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">{selectedUserDetail.bio_description || "-"}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1"><CreditCard size={14} /> <span className="text-[10px] font-bold uppercase">NIK KTP</span></div>
                        <p className="text-sm font-mono font-medium text-gray-800">{selectedUserDetail.nik || "-"}</p>
                      </div>

                      {(selectedUserDetail.beneficiary_type?.toLowerCase() === "organization" || selectedUserDetail.beneficiary_type?.toLowerCase() === "organisasi" || selectedUserDetail.beneficiary_type?.toLowerCase() === "lembaga") && (
                        <>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-1"><Briefcase size={14} /> <span className="text-[10px] font-bold uppercase">PIC (Penanggung Jawab)</span></div>
                            <p className="text-sm font-medium text-gray-800">{selectedUserDetail.pic || "-"}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-1"><FileText size={14} /> <span className="text-[10px] font-bold uppercase">Nomor Registrasi (SK)</span></div>
                            <p className="text-sm font-mono font-medium text-gray-800">{selectedUserDetail.registration_number || "-"}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 mb-1"><CreditCard size={14} /> <span className="text-[10px] font-bold uppercase">NPWP Organisasi</span></div>
                            <p className="text-sm font-mono font-medium text-gray-800">{selectedUserDetail.npwp || "-"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* BAGIAN 4: LAMPIRAN KTP */}
                {selectedUserDetail.role.toLowerCase() === "beneficiary" && (
                  <div>
                    <h5 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Dokumen KTP / Identitas</h5>
                    {getImageUrl(selectedUserDetail.url_ktp) ? (
                      <a href={getImageUrl(selectedUserDetail.url_ktp)!} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md cursor-zoom-in group">
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                          <img 
                            src={getImageUrl(selectedUserDetail.url_ktp)!} 
                            alt="Dokumen KTP" 
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold bg-black/60 px-4 py-2 rounded-full text-xs">Klik untuk perbesar</span>
                          </div>
                        </div>
                      </a>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-medium">Tidak ada foto KTP yang diunggah.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ALASAN PENOLAKAN */}
                {(selectedUserDetail.status?.toLowerCase() === 'rejected' || !!selectedUserDetail.reason || !!selectedUserDetail.reject_reason) && selectedUserDetail.is_verified === false && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                      <AlertTriangle size={14} /> <span className="text-[10px] font-bold uppercase">Alasan Penolakan Terakhir</span>
                    </div>
                    <p className="text-sm font-medium text-red-700">{selectedUserDetail.reason || selectedUserDetail.reject_reason}</p>
                  </div>
                )}

              </div>
            ) : null}
            
            {/* Footer Modal */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
               <button 
                 onClick={() => {setIsDetailModalOpen(false); setSelectedUserDetail(null);}} 
                 className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition shadow-sm"
               >
                 Tutup Panel
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPROVE */}
      {isApproveModalOpen && approveData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Setujui Akun Ini?</h3>
            <p className="text-sm text-gray-500 mb-6">Anda akan memverifikasi <b>{approveData.name}</b>.</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setIsApproveModalOpen(false)} disabled={isSubmitting} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={submitApprove} disabled={isSubmitting} className="w-1/2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all shadow-[0_10px_20px_-10px_rgba(34,197,94,0.5)] flex justify-center items-center gap-2">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Verifikasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJECT */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center"><AlertTriangle size={24} /></div>
              <div><h3 className="text-lg font-black text-gray-800">Tolak Verifikasi</h3><p className="text-xs text-gray-500">Berikan alasan agar pengguna bisa merevisinya.</p></div>
            </div>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Contoh: Foto KTP yang Anda unggah buram."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-32 mb-4"
            ></textarea>
            <div className="flex w-full gap-3">
              <button onClick={() => {setIsRejectModalOpen(false); setRejectReason("");}} disabled={isSubmitting} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={submitReject} disabled={isSubmitting} className="w-1/2 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] flex justify-center items-center gap-2">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Kirim Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & TABS NAVIGATION */}
      <div>
        <h1 className="text-2xl font-black text-gray-800">Manajemen Pengguna</h1>
        <p className="text-gray-500 mt-1">Tinjau kelayakan akun. Donatur (User) otomatis terverifikasi tanpa antrean.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-200/50 p-1 rounded-xl w-max border border-gray-200 shrink-0 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab("semua")} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "semua" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <ListFilter size={16} /> Semua <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'semua' ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>{searchedUsers.length}</span>
          </button>
          <button onClick={() => setActiveTab("pending")} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "pending" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Clock size={16} /> Menunggu <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'}`}>{pendingUsers.length}</span>
          </button>
          <button onClick={() => setActiveTab("verified")} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "verified" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <ShieldCheck size={16} /> Diverifikasi <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{verifiedUsers.length}</span>
          </button>
          <button onClick={() => setActiveTab("rejected")} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "rejected" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <XCircle size={16} /> Ditolak <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}>{rejectedUsers.length}</span>
          </button>
        </div>

        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
          <input type="text" placeholder="Cari nama atau email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent block pl-10 p-2.5 shadow-sm transition-all outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center h-full">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-600 font-bold animate-pulse">Menarik data pengguna...</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-5 md:pl-8">Profil</th>
                  <th className="p-5">Tipe Pengguna</th>
                  <th className="p-5">Informasi & Kontak</th>
                  <th className="p-5 text-center">Status</th>
                  <th className="p-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? paginatedData.map((user) => {
                  const role = (user.role || "").toLowerCase();
                  const isUmum = role === "user";
                  const isRejected = user.status?.toLowerCase() === 'rejected' || !!user.reason || !!user.reject_reason;
                  const isVerified = user.is_verified === true || isUmum;
                  const isPending = user.is_verified === false && !isRejected && !isUmum;

                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 md:pl-8">
                        <p className="font-bold text-gray-800">{user.full_name}</p>
                        {isVerified && user.wallet_address ? (
                           <p className="text-[10px] text-gray-400 font-mono mt-0.5" title={user.wallet_address}>
                              Wallet: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
                           </p>
                        ) : (
                           <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              Daftar: {new Date(user.created_at).toLocaleDateString("id-ID")}
                           </p>
                        )}
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">{user.role}</span>
                        {!isUmum && renderBeneficiaryType(user.beneficiary_type)}
                      </td>
                      <td className="p-5">
                        {isRejected ? (
                          <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-[11px] font-medium flex items-start gap-1.5 max-w-[200px]">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p className="line-clamp-2" title={user.reason || user.reject_reason}>{user.reason || user.reject_reason || "Tidak ada detail alasan."}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-600 font-medium">{user.email}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{user.phone_number || "-"}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        {renderStatusBadge(user)}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* 🔥 TOMBOL MENGGUNAKAN API FETCH DETAIL KHUSUS */}
                          <button 
                            onClick={() => fetchUserDetail(user.id)} 
                            className="p-2.5 bg-gray-50 text-gray-600 hover:bg-blue-500 hover:text-white rounded-xl transition shadow-sm" 
                            title="Lihat Detail Profil"
                          >
                            <FileSearch size={18} />
                          </button>
                          
                          {isPending && (
                            <>
                              <button onClick={() => { setApproveData({id: user.id, name: user.full_name}); setIsApproveModalOpen(true); }} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition shadow-sm" title="Setujui"><CheckCircle2 size={18} /></button>
                              <button onClick={() => {setSelectedUserId(user.id); setIsRejectModalOpen(true);}} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm" title="Tolak"><XCircle size={18} /></button>
                            </>
                          )}
                          {isVerified && !isUmum && (
                            <button className="p-2.5 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition shadow-sm" title="Cabut Verifikasi (Suspend)"><Ban size={18} /></button>
                          )}
                          {isRejected && (
                            <button onClick={() => { setApproveData({id: user.id, name: user.full_name}); setIsApproveModalOpen(true); }} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm" title="Tinjau Ulang (Setujui)"><CheckCircle2 size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        {searchQuery ? <Search size={40} className="mb-3 opacity-20" /> : <ListFilter size={40} className="mb-3 opacity-20" />}
                        <p className="font-bold text-gray-500">Data tidak ditemukan</p>
                        <p className="text-xs mt-1">Tidak ada data untuk ditampilkan pada tab ini.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && activeDataList.length > 0 && (
          <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs font-bold text-gray-500">
              Menampilkan <span className="text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="text-gray-800">{Math.min(currentPage * itemsPerPage, activeDataList.length)}</span> dari <span className="text-gray-800">{activeDataList.length}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold text-gray-600 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">Hal {currentPage} dari {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}