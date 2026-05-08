"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  CheckCircle2, XCircle, Eye, AlertCircle, 
  Clock, ListFilter, Ban, Search, ShieldCheck, AlertTriangle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { apiFetch } from "@/lib/api"; 
import toast from 'react-hot-toast';

export default function ManageCampaignsPage() {
  const [activeFilter, setActiveFilter] = useState<"semua" | "pending" | "active" | "rejected">("semua");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // 🔥 UBAH ID JADI SLUG DI STATE
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveData, setApproveData] = useState<{slug: string, title: string} | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectData, setRejectData] = useState<{slug: string, title: string, actionType: "reject" | "suspend"} | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/admin/campaigns", { method: "GET" });
      const data = res?.data || res;
      if (Array.isArray(data)) setCampaigns(data);
      else setCampaigns([]);
    } catch (error) {
      toast.error("Gagal menarik data kampanye.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // 🔥 FUNGSI HELPER UNTUK MENGUBAH CATEGORY_ID MENJADI TEKS
  const getCategoryName = (id: string | number) => {
    switch (String(id)) {
      case "1": return "Pendidikan";
      case "2": return "Kesehatan";
      case "3": return "Bencana";
      case "4": return "Tempat Ibadah";
      default: return "Umum";
    }
  };

  const submitApprove = async () => {
    if (!approveData) return;
    setIsSubmitting(true);
    const approvePromise = apiFetch(`/admin/campaigns/${approveData.slug}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }) 
    });
    toast.promise(approvePromise, {
      loading: 'Memverifikasi kampanye...',
      success: <b>Kampanye berhasil diaktifkan!</b>,
      error: <b>Gagal memverifikasi kampanye.</b>,
    });
    try {
      await approvePromise;
      setIsApproveModalOpen(false);
      setApproveData(null);
      fetchCampaigns(); 
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return toast.error("Alasan wajib diisi!", { icon: '⚠️' });
    if (!rejectData) return;
    setIsSubmitting(true);
    
    const rejectPromise = apiFetch(`/admin/campaigns/reject/${rejectData.slug}`, {
      method: "PATCH", 
      body: JSON.stringify({ reject_reason: rejectReason })
    });

    toast.promise(rejectPromise, {
      loading: 'Memproses permintaan...',
      success: <b>Berhasil menolak kampanye.</b>,
      error: <b>Gagal memproses data.</b>,
    });

    try {
      await rejectPromise;
      setIsRejectModalOpen(false);
      setRejectReason("");
      setRejectData(null);
      fetchCampaigns(); // Tarik data ulang agar tabel ter-update
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const searchedCampaigns = campaigns.filter((camp) => {
    const title = (camp.title || "").toLowerCase();
    const ownerName = (camp.full_name || camp.user?.full_name || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || ownerName.includes(query);
  });

  const countPending = campaigns.filter(c => c.status?.toLowerCase() === 'pending').length;
  const countActive = campaigns.filter(c => c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'approved').length;
  const countRejected = campaigns.filter(c => c.status?.toLowerCase() === 'rejected').length;

  let activeDataList = [];
  if (activeFilter === "semua") activeDataList = searchedCampaigns;
  else if (activeFilter === "pending") activeDataList = searchedCampaigns.filter(c => c.status?.toLowerCase() === 'pending');
  else if (activeFilter === "active") activeDataList = searchedCampaigns.filter(c => c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'approved');
  else if (activeFilter === "rejected") activeDataList = searchedCampaigns.filter(c => c.status?.toLowerCase() === 'rejected');

  const totalPages = Math.ceil(activeDataList.length / itemsPerPage) || 1;
  const paginatedData = activeDataList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
        return <span className="flex items-center gap-1 w-max bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-green-100"><CheckCircle2 size={12}/> Aktif</span>;
      case "rejected":
        return <span className="flex items-center gap-1 w-max bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-100"><XCircle size={12}/> Ditolak</span>;
      default:
        return <span className="flex items-center gap-1 w-max bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-orange-100"><Clock size={12}/> Menunggu</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 relative">
      
      {/* MODAL APPROVE */}
      {isApproveModalOpen && approveData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Tayangkan Kampanye?</h3>
            <p className="text-sm text-gray-500 mb-6">Kampanye <b>"{approveData.title}"</b> akan segera dapat menerima donasi.</p>
            <div className="flex w-full gap-3">
              <button onClick={() => setIsApproveModalOpen(false)} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">Batal</button>
              <button onClick={submitApprove} disabled={isSubmitting} className="w-1/2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all shadow-[0_10px_20px_-10px_rgba(34,197,94,0.5)]">
                {isSubmitting ? "Memproses..." : "Ya, Tayangkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJECT / SUSPEND */}
      {isRejectModalOpen && rejectData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className={`flex items-center gap-3 mb-4 ${rejectData.actionType === 'suspend' ? 'text-orange-500' : 'text-red-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${rejectData.actionType === 'suspend' ? 'bg-orange-50' : 'bg-red-50'}`}>
                {rejectData.actionType === 'suspend' ? <Ban size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div><h3 className="text-lg font-black text-gray-800">{rejectData.actionType === 'suspend' ? 'Suspend' : 'Tolak'} Kampanye</h3><p className="text-xs text-gray-500">Alasan tindakan ini:</p></div>
            </div>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 mb-4"
              placeholder="Contoh: Dokumen legalitas tidak valid."
            ></textarea>
            <div className="flex w-full gap-3">
              <button onClick={() => {setIsRejectModalOpen(false); setRejectData(null);}} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl transition-all">Batal</button>
              <button onClick={submitReject} disabled={isSubmitting} className={`w-1/2 text-white font-bold py-3 rounded-xl transition-all ${rejectData.actionType === 'suspend' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {isSubmitting ? "Memproses..." : "Kirim Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Kelola Kampanye</h1>
        <p className="text-gray-500 mt-1 text-sm">Monitor dan validasi setiap program penggalangan dana.</p>
      </div>

      {/* ACTION BAR: SEARCH & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
          <input type="text" placeholder="Cari judul atau penggalang..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-purple-500 block pl-10 p-2.5 transition-all outline-none" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button onClick={() => setActiveFilter("semua")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${activeFilter === "semua" ? "bg-gray-800 text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
            Semua <span className="ml-1 text-[10px] opacity-60">({searchedCampaigns.length})</span>
          </button>
          <button onClick={() => setActiveFilter("pending")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${activeFilter === "pending" ? "bg-orange-500 text-white shadow-md" : "bg-orange-50 text-orange-600"}`}>
            Menunggu <span className="ml-1 text-[10px] opacity-60">({countPending})</span>
          </button>
          <button onClick={() => setActiveFilter("active")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${activeFilter === "active" ? "bg-green-500 text-white shadow-md" : "bg-green-50 text-green-600"}`}>
            Aktif <span className="ml-1 text-[10px] opacity-60">({countActive})</span>
          </button>
          <button onClick={() => setActiveFilter("rejected")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${activeFilter === "rejected" ? "bg-red-500 text-white shadow-md" : "bg-red-50 text-red-600"}`}>
            Ditolak <span className="ml-1 text-[10px] opacity-60">({countRejected})</span>
          </button>
        </div>
      </div>

      {/* TABEL DENGAN PAGINASI */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center h-full">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-600 font-bold animate-pulse">Menarik data kampanye...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-5 md:pl-8">Program & Kategori</th>
                    <th className="p-5">Penggalang Dana</th>
                    <th className="p-5">Target (FCC)</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? paginatedData.map((camp) => (
                    <tr key={camp.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 md:pl-8">
                        <p className="font-bold text-gray-800 line-clamp-1">{camp.title}</p>
                        {/* 🔥 BAGIAN INI DIPERBARUI: Menggunakan fungsi getCategoryName() 🔥 */}
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 mt-1 inline-block">
                          {camp.category?.name || getCategoryName(camp.category_id)}
                        </span>
                      </td>
                      <td className="p-5">
                        <p className="text-sm font-bold text-gray-700">{camp.full_name || camp.user?.full_name || "Anonim"}</p>
                        <p className="text-[10px] text-gray-400">ID: {camp.id}</p>
                      </td>
                      <td className="p-5">
                        <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">{camp.target_amount || camp.target || 0} FCC</span>
                      </td>
                      <td className="p-5">
                        {renderStatusBadge(camp.status)}
                        {camp.status?.toLowerCase() === 'rejected' && (camp.rejection_reason || camp.reason) && (
                          <p className="text-[10px] text-red-400 mt-1 max-w-[120px] line-clamp-1 flex items-center gap-1" title={camp.rejection_reason || camp.reason}>
                            <AlertCircle size={10} className="shrink-0"/> {camp.rejection_reason || camp.reason}
                          </p>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          
                          <Link 
                            href={`/campaigns/${camp.slug || camp.id}`} 
                            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition shadow-sm inline-flex items-center justify-center"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </Link>

                          {camp.status?.toLowerCase() === 'pending' && (
                            <>
                              <button onClick={() => { setApproveData({slug: camp.slug || camp.id, title: camp.title}); setIsApproveModalOpen(true); }} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition shadow-sm" title="Go Live (Approve)"><CheckCircle2 size={18} /></button>
                              <button onClick={() => { setRejectData({slug: camp.slug || camp.id, title: camp.title, actionType: 'reject'}); setIsRejectModalOpen(true); }} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition shadow-sm" title="Tolak Kampanye"><XCircle size={18} /></button>
                            </>
                          )}
                          {(camp.status?.toLowerCase() === 'active' || camp.status?.toLowerCase() === 'approved') && (
                            <button onClick={() => { setRejectData({slug: camp.slug || camp.id, title: camp.title, actionType: 'suspend'}); setIsRejectModalOpen(true); }} className="p-2.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl transition shadow-sm" title="Hentikan / Suspend Kampanye"><Ban size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400"><ListFilter size={40} className="mb-3 mx-auto opacity-20" /><p className="font-bold">Data tidak ditemukan</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER PAGINASI */}
            {!isLoading && activeDataList.length > 0 && (
              <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-500">Menampilkan <span className="text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-800">{Math.min(currentPage * itemsPerPage, activeDataList.length)}</span> dari {activeDataList.length}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                  <span className="text-xs font-bold px-3">Hal {currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white border border-gray-200 disabled:opacity-50 transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}