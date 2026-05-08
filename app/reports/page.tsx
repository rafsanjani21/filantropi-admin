"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Send, Wallet, Clock, RefreshCw, Banknote, FileText, Image as ImageIcon, QrCode, X, Copy, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";
import QRCode from "react-qr-code"; 

export default function VerifyReportsPage() {
  // 🔥 BASE URL UNTUK GAMBAR
  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  // 🔥 STATE TAB AKTIF: disbursements (Tahap 1), reports (Tahap 2+)
  const [activeTab, setActiveTab] = useState<"disbursements" | "reports">("disbursements");

  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [confirmApproveData, setConfirmApproveData] = useState<{ id: string; title: string, type: "disbursements" | "reports" } | null>(null);
  
  // 🔥 STATE BARU UNTUK PENOLAKAN (Hanya untuk Reports)
  const [confirmRejectData, setConfirmRejectData] = useState<{ id: string; title: string, type: "reports" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 STATE UNTUK MODAL QR CODE
  const [qrWallet, setQrWallet] = useState<string | null>(null);

  // FETCH TAHAP 1
  const fetchPendingDisbursements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/admin/disbursements/pending", { method: "GET" });
      setDisbursements(res?.data || []);
    } catch (error) {
      toast.error("Gagal menarik antrean pencairan dana.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FETCH TAHAP 2+
  const fetchPendingReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/admin/reports/pending", { method: "GET" });
      setReports(res?.data || []);
    } catch (error) {
      toast.error("Gagal menarik antrean laporan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "disbursements") fetchPendingDisbursements();
    else fetchPendingReports();
  }, [activeTab, fetchPendingDisbursements, fetchPendingReports]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  // 🔥 FUNGSI FORMAT WALLET 4 DEPAN 4 BELAKANG (Hanya dipakai di tabel)
  const formatWallet = (wallet: string) => {
    if (!wallet) return "-";
    if (wallet.length <= 8) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  // 🔥 FUNGSI SALIN WALLET DI DALAM MODAL QR
  const handleCopyWallet = (wallet: string) => {
    navigator.clipboard.writeText(wallet);
    toast.success("Alamat wallet berhasil disalin!");
  };

  // 🔥 EKSEKUSI APPROVE DINAMIS
  const executeApprove = async () => {
    if (!confirmApproveData) return;
    setIsSubmitting(true);
    const { id, type } = confirmApproveData;

    const apiUrl = type === "disbursements" 
      ? `/admin/disbursements/approve/${id}` 
      : `/admin/reports/approve/${id}`;

    const approvePromise = apiFetch(apiUrl, { method: "PATCH" }); 

    toast.promise(approvePromise, {
      loading: `Memproses...`,
      success: <b>{type === "disbursements" ? "Pencairan Tahap Awal disetujui!" : "Laporan disetujui, dana dicairkan!"}</b>,
      error: <b>Gagal memproses persetujuan.</b>,
    });

    try {
      await approvePromise;
      if (type === "disbursements") fetchPendingDisbursements();
      else fetchPendingReports();
      setConfirmApproveData(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 EKSEKUSI REJECT (TOLAK) KHUSUS LAPORAN
  const executeReject = async () => {
    if (!confirmRejectData) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi!");
      return;
    }
    
    setIsSubmitting(true);
    const { id } = confirmRejectData;

    const apiUrl = `/admin/reports/reject/${id}`;

    const rejectPromise = apiFetch(apiUrl, { 
      method: "PATCH", 
      body: JSON.stringify({ reject_reason: rejectReason })
    });

    toast.promise(rejectPromise, {
      loading: `Memproses penolakan...`,
      success: <b>Laporan berhasil ditolak!</b>,
      error: <b>Gagal memproses penolakan.</b>,
    });

    try {
      await rejectPromise;
      fetchPendingReports(); 
      setConfirmRejectData(null);
      setRejectReason(""); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
      
      {/* 🔥 MODAL QR CODE WALLET */}
      {qrWallet && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl flex flex-col items-center p-6 text-center shadow-2xl animate-in zoom-in-95 relative">
            <button 
              onClick={() => setQrWallet(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mt-2">
              <QrCode size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Scan QR Wallet</h3>
            <p className="text-xs text-gray-500 mb-4">Pindai QR ini untuk mentransfer dana pencairan.</p>

            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm mb-6 inline-block">
              <QRCode value={qrWallet} size={180} fgColor="#4c1d95" />
            </div>

            <div className="w-full text-left">
              <button 
                type="button"
                onClick={() => handleCopyWallet(qrWallet)}
                className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 p-4 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-colors active:scale-95 text-left"
              >
                {/* 🔥 DIBUAT TAMPIL FULL & BISA TURUN BARIS JIKA PANJANG */}
                <span className="text-[11px] font-mono text-gray-600 break-all">{qrWallet}</span>
                <Copy size={18} className="text-purple-600 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI APPROVE */}
      {confirmApproveData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-3xl flex flex-col items-center p-6 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5 border-4 border-green-100">
              {confirmApproveData.type === "reports" ? <FileText size={36} /> : <Banknote size={36} />}
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Konfirmasi Persetujuan</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menyetujui {confirmApproveData.type === "reports" ? "laporan dan " : ""} pencairan dana untuk kampanye <br />
              <b className="text-gray-700">"{confirmApproveData.title}"</b>?
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setConfirmApproveData(null)} disabled={isSubmitting} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-2xl hover:bg-gray-200 disabled:opacity-50">Batal</button>
              <button onClick={executeApprove} disabled={isSubmitting} className="w-1/2 flex justify-center items-center gap-2 bg-green-500 text-white font-bold py-3.5 rounded-2xl hover:bg-green-600 disabled:opacity-50">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL KONFIRMASI REJECT (TOLAK) */}
      {confirmRejectData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">Tolak Pengajuan Laporan</h3>
                <p className="text-xs text-gray-500 font-medium">Kampanye: {confirmRejectData.title}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Alasan Penolakan</label>
              <textarea 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" 
                placeholder="Ketikkan alasan mengapa laporan ini ditolak..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setConfirmRejectData(null); setRejectReason(""); }} disabled={isSubmitting} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 disabled:opacity-50">Batal</button>
              <button onClick={executeReject} disabled={isSubmitting} className="w-1/2 flex justify-center items-center gap-2 bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 disabled:opacity-50">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Kirim Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Tinjauan Pencairan & Laporan</h1>
          <p className="text-gray-500 mt-1">Verifikasi pengajuan dana awal maupun laporan dana tahap lanjutan.</p>
        </div>
        <button 
          onClick={() => activeTab === "disbursements" ? fetchPendingDisbursements() : fetchPendingReports()}
          disabled={isLoading || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Segarkan
        </button>
      </div>

      {/* 🔥 TABS NAVIGASI */}
      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-2xl w-max border border-gray-200 shadow-inner">
        <button 
          onClick={() => setActiveTab("disbursements")} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "disbursements" ? "bg-white text-purple-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
        >
          <Banknote size={16} /> Pencairan
        </button>
        <button 
          onClick={() => setActiveTab("reports")} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "reports" ? "bg-white text-purple-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}
        >
          <FileText size={16} /> Laporan Progress
        </button>
      </div>

      {/* TABEL AREA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center h-full">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-600 font-bold animate-pulse">Menarik data antrean...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "disbursements" ? (
              // ================= TABEL TAHAP 1 (TANPA TOMBOL TOLAK) =================
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5 md:pl-8">Nama Kampanye</th>
                    <th className="p-5">Fase Pencairan</th>
                    <th className="p-5">Informasi Wallet & Tanggal</th>
                    <th className="p-5 text-center">Aksi (Cairkan)</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.length > 0 ? disbursements.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 md:pl-8">
                        <p className="font-bold text-gray-800 line-clamp-2">{item.campaign_title}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-1">ID: {item.campaign_id?.substring(0, 8)}...</p>
                      </td>
                      <td className="p-5">
                        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100">
                          <Clock size={14} />
                          <span className="text-[11px] font-black uppercase tracking-wider">Tahap {item.phase || 1}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Wallet size={14} className="text-purple-500 shrink-0" />
                            <button
                              onClick={() => setQrWallet(item.wallet_address)}
                              className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-100 transition-colors cursor-pointer w-max"
                              title={`Tampilkan QR untuk ${item.wallet_address}`}
                            >
                              <span>{formatWallet(item.wallet_address)}</span>
                              <QrCode size={12} className="shrink-0 opacity-60" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500"><Clock size={14} className="shrink-0" /><span className="text-xs font-medium">{formatDate(item.created_at)}</span></div>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        {/* HANYA ADA TOMBOL SETUJUI DI SINI */}
                        <button onClick={() => setConfirmApproveData({ id: item.id, title: item.campaign_title, type: "disbursements" })} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-xl transition shadow-md shadow-green-200 text-xs font-bold active:scale-95">
                          <Send size={14} /> Setujui
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-16 text-center"><CheckCircle2 size={48} className="mx-auto mb-4 text-green-200" /><p className="font-bold text-gray-600 text-lg">Semua Bersih!</p><p className="text-sm mt-1 text-gray-400">Tidak ada pencairan awal yang perlu ditinjau.</p></td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              // ================= TABEL TAHAP 2+ (REPORT) =================
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-5 md:pl-8">Nama Kampanye</th>
                    <th className="p-5 w-1/3">Detail Laporan</th>
                    <th className="p-5">Lampiran Bukti</th>
                    <th className="p-5 text-center">Aksi (Setuju/Tolak)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length > 0 ? reports.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 md:pl-8">
                        <p className="font-bold text-gray-800 line-clamp-2">{item.campaign_title || "Kampanye ID: " + item.campaign_id?.substring(0,8)}</p>
                        <div className="inline-flex mt-2 items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                          <Clock size={12} /><span className="text-[10px] font-black uppercase tracking-wider">Laporan Tahap {item.phase || "Lanjut"}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 line-clamp-3">
                          {item.description || "Tidak ada deskripsi."}
                        </p>
                      </td>
                      <td className="p-5">
                        {(() => {
                          let parsedImgs: string[] = [];
                          if (item.proof_url) {
                            try {
                              parsedImgs = typeof item.proof_url === 'string' && item.proof_url.startsWith('[')
                                ? JSON.parse(item.proof_url)
                                : [item.proof_url]; 
                            } catch(e) {
                              parsedImgs = [item.proof_url];
                            }
                          }

                          if (parsedImgs.length > 0) {
                            return (
                              <div className="flex flex-col gap-2">
                                {parsedImgs.map((imgPath: string, idx: number) => {
                                  const cleanPath = imgPath.replace(/^\/+/, '');
                                  const fullUrl = imgPath.startsWith('http') ? imgPath : `${IMAGE_BASE_URL}/${cleanPath}`;

                                  return (
                                    <a 
                                      key={idx} 
                                      href={fullUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="flex items-center gap-2 text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg border border-purple-100 transition w-max"
                                    >
                                      <ImageIcon size={14} /> Lihat Bukti {idx + 1}
                                    </a>
                                  );
                                })}
                              </div>
                            );
                          }

                          return <span className="text-xs text-gray-400 italic">Tidak ada lampiran</span>;
                        })()}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setConfirmApproveData({ id: item.id, title: item.campaign_title || "Laporan ini", type: "reports" })} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition shadow-sm text-xs font-bold active:scale-95">
                            <Send size={14} /> Setujui
                          </button>
                          <button onClick={() => setConfirmRejectData({ id: item.id, title: item.campaign_title || "Laporan ini", type: "reports" })} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition shadow-sm border border-red-100 hover:border-red-500 text-xs font-bold active:scale-95">
                            <X size={14} /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-16 text-center"><CheckCircle2 size={48} className="mx-auto mb-4 text-green-200" /><p className="font-bold text-gray-600 text-lg">Semua Laporan Terverifikasi!</p><p className="text-sm mt-1 text-gray-400">Tidak ada laporan tahap lanjut yang menunggu ditinjau.</p></td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
}