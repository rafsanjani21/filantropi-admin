"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  Wallet, User, CalendarDays, Ban, AlertTriangle, 
  Target, FileText, Image as ImageIcon, ShieldCheck,
  RefreshCw, Coins, Copy, History, ArrowDownRight, ExternalLink,
  ChevronLeft, ChevronRight, Save
} from "lucide-react";
import { apiFetch } from "@/lib/api"; 
import toast from 'react-hot-toast';

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // STATE DARI KODE USER: RIWAYAT & LIVE BALANCE
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // STATE BARU UNTUK PAGINATION RIWAYAT DONASI
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // STATE MODAL ADMIN
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionType, setActionType] = useState<"reject" | "suspend">("reject");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 STATE BARU UNTUK INPUT WALLET LEMBAGA OLEH ADMIN
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  const fetchCampaignDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/admin/campaigns/${slug}`, { method: "GET" });
      const data = res?.data || res;
      setCampaign(data);
      // Sinkronkan state input wallet dengan data dari database
      setNewWalletAddress(data.wallet_address || "");
    } catch (error) {
      toast.error("Gagal menarik data detail kampanye.");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchCampaignDetail();
  }, [slug, fetchCampaignDetail]);

  const fetchCampaignHistory = useCallback(async () => {
    const receiverWallet = campaign?.wallet_address;
    if (!receiverWallet) return;
    
    setIsLoadingHistory(true);
    try {
      const [historyRes, balanceRes] = await Promise.all([
        apiFetch(`/donations/wallets/history/${receiverWallet}`, { method: "GET" }).catch(() => null),
        apiFetch(`/donations/wallet/balance/${receiverWallet}`, { method: "GET" }).catch(() => null)
      ]);
      
      if (historyRes && historyRes.data) {
        const incomingDonations = historyRes.data
          .filter((tx: any) => tx.type?.toLowerCase() === "in")
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setWalletHistory(incomingDonations);
        setCurrentPage(1); 
      } else {
        setWalletHistory([]);
      }

      if (balanceRes && balanceRes.data !== undefined) {
        const balanceData = typeof balanceRes.data === 'object' ? balanceRes.data.balance : balanceRes.data;
        setLiveBalance(parseFloat(balanceData || "0"));
      } else {
        setLiveBalance(0);
      }

    } catch (err) {
      console.error("Gagal menarik data wallet:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [campaign?.wallet_address]);

  useEffect(() => {
    if (campaign?.wallet_address) fetchCampaignHistory();
  }, [campaign?.wallet_address, fetchCampaignHistory]);

  const handleCopyWallet = () => {
    if (campaign?.wallet_address) {
      navigator.clipboard.writeText(campaign.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Wallet berhasil disalin!");
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const formatSenderWallet = (text: string) => {
    if (!text) return "Anonim";
    const match = text.match(/(0x[a-fA-F0-9]+)/);
    if (match) {
      const addr = match[0];
      if (addr.length >= 8) return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    }
    return text;
  };

  // 🔥 IDENTIFIKASI TIPE PENGGALANG (INDIVIDU / LEMBAGA)
  const campaignTypeStr = String(
    campaign?.beneficiary?.beneficiary_type || 
    campaign?.beneficiary?.type || 
    campaign?.user?.beneficiary_type || 
    campaign?.user?.type || 
    campaign?.beneficiary_type || 
    campaign?.type || 
    ""
  ).toLowerCase().trim();

  const isCampaignIndividual = campaignTypeStr.includes("individu") || campaignTypeStr.includes("personal");
  const isOrganization = !isCampaignIndividual && campaignTypeStr !== ""; // Jika kosong, anggap aman dulu

  // 🔥 FUNGSI UPDATE WALLET OLEH ADMIN
  const submitUpdateWallet = async () => {
    if (!newWalletAddress.trim()) return toast.error("Wallet tidak boleh kosong!");
    setIsUpdatingWallet(true);

    const updatePromise = apiFetch(`/admin/update/wallet/${campaign.id}`, {
      method: "PATCH", // Atau "PUT", sesuaikan dengan Backend Anda
      body: JSON.stringify({ wallet_address: newWalletAddress.trim() }) 
      // Catatan: Jika backend Anda murni typo 'walllet_adddress', ubah key di atas menjadi "walllet_adddress".
    });

    toast.promise(updatePromise, {
      loading: 'Menyimpan wallet...',
      success: <b>Wallet lembaga berhasil diperbarui!</b>,
      error: <b>Gagal memperbarui wallet.</b>
    });

    try {
      await updatePromise;
      fetchCampaignDetail(); // Tarik data baru setelah update
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  const submitApprove = async () => {
    // 🔥 VALIDASI: Jangan izinkan approve jika lembaga tapi wallet belum diisi admin
    if (isOrganization && !campaign?.wallet_address) {
      toast.error("Harap masukkan dan simpan Wallet Lembaga terlebih dahulu sebelum menayangkan kampanye!", { duration: 4000 });
      setIsApproveModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    const targetSlug = campaign.slug || campaign.id; 
    const approvePromise = apiFetch(`/admin/campaigns/${targetSlug}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
    toast.promise(approvePromise, { loading: 'Menyetujui...', success: <b>Ditayangkan!</b>, error: <b>Gagal.</b> });
    try { await approvePromise; setIsApproveModalOpen(false); fetchCampaignDetail(); } catch (error) {} finally { setIsSubmitting(false); }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return toast.error("Alasan wajib diisi!", { icon: '⚠️' });
    setIsSubmitting(true);
    
    const targetSlug = campaign.slug || campaign.id; 
    const rejectPromise = apiFetch(`/admin/campaigns/reject/${targetSlug}`, { 
      method: "PATCH", 
      body: JSON.stringify({ reject_reason: rejectReason }) 
    });

    toast.promise(rejectPromise, { loading: 'Memproses...', success: <b>Kampanye berhasil ditolak.</b>, error: <b>Gagal.</b> });

    try { 
      await rejectPromise; 
      setIsRejectModalOpen(false); 
      setRejectReason(""); 
      fetchCampaignDetail(); 
    } catch (error) {
      console.error(error);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
        <p className="text-purple-600 font-bold animate-pulse">Memuat detail...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <FileText size={64} className="text-gray-300" />
        <h2 className="text-2xl font-black text-gray-800">Kampanye Tidak Ditemukan</h2>
        <Link href="/campaigns" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Kembali</Link>
      </div>
    );
  }

  const isPending = campaign.status?.toLowerCase() === 'pending';
  const isActive = campaign.status?.toLowerCase() === 'active' || campaign.status?.toLowerCase() === 'approved';
  const isRejected = campaign.status?.toLowerCase() === 'rejected';

  const rawTarget = campaign?.target_amount || 1;
  const target = typeof rawTarget === 'string' ? parseFloat(rawTarget.replace(/[^\d.-]/g, '')) : rawTarget;
  const rawCollected = liveBalance !== null ? liveBalance : (campaign?.current_amount || 0);
  const collected = typeof rawCollected === 'string' ? parseFloat(rawCollected.replace(/[^\d.-]/g, '')) : rawCollected;

  const calculateProgress = () => {
    if (target === 0) return 0;
    const percent = (collected / target) * 100;
    return percent > 100 ? 100 : percent > 99 ? Number(percent.toFixed(1)) : Math.floor(percent);
  };
  const progress = calculateProgress();

  const calculateDaysLeft = (date: string) => {
    if (!date) return 0;
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const daysLeft = calculateDaysLeft(campaign?.end_date);

  const imageUrl = campaign.image_banner?.startsWith("http") ? campaign.image_banner : `${IMAGE_BASE_URL}/${campaign.image_banner?.replace(/^\/+/, "")}`;

  // LOGIKA PAGINATION RIWAYAT DONASI
  const totalPages = Math.ceil(walletHistory.length / itemsPerPage) || 1;
  const paginatedHistory = walletHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* MODAL APPROVE & REJECT */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Tayangkan Kampanye?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsApproveModalOpen(false)} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200">Batal</button>
              <button onClick={submitApprove} disabled={isSubmitting} className="w-1/2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600">Ya, Tayangkan</button>
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className={`flex items-center gap-3 mb-4 ${actionType === 'suspend' ? 'text-orange-500' : 'text-red-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${actionType === 'suspend' ? 'bg-orange-50' : 'bg-red-50'}`}>
                {actionType === 'suspend' ? <Ban size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div><h3 className="text-lg font-black text-gray-800">{actionType === 'suspend' ? 'Tangguhkan' : 'Tolak'}</h3></div>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm h-32 mb-4" placeholder="Ketikkan alasan secara detail..."></textarea>
            <div className="flex gap-3">
              <button onClick={() => {setIsRejectModalOpen(false); setRejectReason("");}} className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Batal</button>
              <button onClick={submitReject} disabled={isSubmitting} className={`w-1/2 text-white font-bold py-3 rounded-xl ${actionType === 'suspend' ? 'bg-orange-500' : 'bg-red-500'}`}>Kirim</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER NAV */}
      <div className="flex items-center justify-between">
        <Link href="/campaigns" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition shadow-sm">
          <ArrowLeft size={16} /> Kembali
        </Link>
        {isActive && <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl font-black uppercase text-xs"><CheckCircle2 size={16}/> Aktif</div>}
        {isPending && <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-black uppercase text-xs"><Clock size={16}/> Menunggu Tinjauan</div>}
        {isRejected && <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-black uppercase text-xs"><XCircle size={16}/> Ditolak</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KOTAK ALASAN PENOLAKAN */}
          {isRejected && (
            <div className="bg-red-50 border border-red-100 p-5 md:p-6 rounded-[2rem] shadow-sm flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-red-800 font-black text-sm uppercase tracking-wider mb-1">Alasan Penolakan</h3>
                <p className="text-red-600 text-sm font-medium leading-relaxed">
                  {campaign.reject_reason || campaign.reason || "Tidak ada detail alasan yang disertakan saat menolak kampanye ini."}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[1.5rem] overflow-hidden bg-gray-100">
              {campaign.image_banner ? <img src={imageUrl} alt={campaign.title} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-400"><ImageIcon size={48} className="opacity-20"/></div>}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-4">{campaign.title}</h1>
            <p className="text-gray-600 font-medium leading-relaxed mb-6 text-lg">{campaign.description}</p>
            <hr className="border-gray-100 mb-6" />
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText size={20} className="text-purple-500"/> Cerita Lengkap</h3>
            <div className="prose prose-purple max-w-none text-gray-600 text-sm whitespace-pre-wrap">{campaign.story || "-"}</div>
          </div>

          {/* RIWAYAT DONASI MASUK DENGAN PAGINATION */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <History size={20} className="text-purple-600"/> Riwayat Aliran Dana (Blockchain)
            </h3>
            
            <div className="flex flex-col gap-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-6 text-purple-400"><RefreshCw size={24} className="animate-spin" /></div>
              ) : walletHistory.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-2xl">
                  <p className="text-sm font-bold text-gray-500">Belum ada donasi tercatat di Blockchain.</p>
                </div>
              ) : (
                <>
                  {paginatedHistory.map((tx, index) => (
                    <div key={`${tx.tx_hash}-${index}`} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <ArrowDownRight size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Donatur</p>
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{formatSenderWallet(tx.from_to)}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-green-600">+{parseFloat(tx.amount || "0").toFixed(2)} FCC</p>
                        <a href={`https://polygonscan.com/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-end gap-1 text-[10px] text-purple-500 font-bold mt-1 hover:underline">
                          Lihat TX <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                  
                  {/* KONTROL PAGINATION */}
                  {walletHistory.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-bold">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                          disabled={currentPage === 1}
                          className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="space-y-6">
          
          {/* KARTU PENGATURAN WALLET (HANYA MUNCUL JIKA LEMBAGA) */}
          {isOrganization && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 border-t-4 border-t-purple-500 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Wallet Lembaga</h3>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Aksi Wajib Admin</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Karena kampanye ini didaftarkan oleh Lembaga, Anda harus menentukan alamat wallet penyaluran sebelum kampanye ini dapat ditayangkan.
              </p>
              
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  value={newWalletAddress} 
                  onChange={(e) => setNewWalletAddress(e.target.value)} 
                  placeholder="Ketik alamat 0x..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-mono text-gray-700"
                />
                <button 
                  onClick={submitUpdateWallet} 
                  disabled={isUpdatingWallet || newWalletAddress === campaign.wallet_address}
                  className="w-full mt-2 flex justify-center items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
                >
                  {isUpdatingWallet ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {isUpdatingWallet ? "Menyimpan..." : "Simpan Wallet"}
                </button>
              </div>
            </div>
          )}

          {/* KARTU BALANCE ASLI */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] shadow-md text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-widest flex items-center gap-2"><Coins size={16}/> Saldo Real (Blockchain)</h3>
              <button onClick={fetchCampaignHistory} disabled={isLoadingHistory || !campaign.wallet_address} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg shrink-0 disabled:opacity-50">
                <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="relative z-10">
              {!campaign.wallet_address ? (
                 <div className="h-10 flex items-center text-sm text-indigo-200 italic">Wallet belum diatur.</div>
              ) : isLoadingHistory ? (
                <div className="h-10 flex items-center gap-3"><RefreshCw size={20} className="animate-spin"/> Mengambil data...</div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <p className="text-2xl font-black leading-none truncate" title={String(liveBalance !== null ? liveBalance : "0")}>
                    {liveBalance !== null ? liveBalance : "0"}
                  </p>
                  <span className="text-xl font-bold text-indigo-200 mt-1">FCC</span>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-indigo-500/30 flex items-center justify-between gap-2">
                <p className="text-[10px] text-indigo-200 font-mono truncate flex-1" title={campaign.wallet_address || "Belum diatur"}>
                  {campaign.wallet_address || "Alamat wallet belum dimasukkan"}
                </p>
                <button onClick={handleCopyWallet} disabled={!campaign.wallet_address} className="bg-white/20 p-1.5 rounded text-white hover:bg-white/40 shrink-0 disabled:opacity-50">
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* KARTU PROGRESS & TARGET */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
              <Target size={16}/> Progress Pengumpulan
            </h3>
            
            <div className="flex items-end justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xl font-black text-purple-600 truncate" title={`${collected} FCC`}>
                  {collected} <span className="text-lg">FCC</span>
                </p>
                <p className="text-xs font-bold text-gray-500 mt-1 truncate" title={`Terkumpul dari ${target} FCC`}>
                  Terkumpul dari {target} FCC
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-1 bg-green-50 text-green-600 font-black text-sm rounded-lg">{progress}%</span>
              </div>
            </div>
            
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-4 shrink-0">
              <div className="h-full bg-purple-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100">
                <Clock size={14} /> Sisa Waktu: {daysLeft} Hari
              </div>
            </div>
          </div>

          {/* KARTU PENGGALANG DANA */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User size={16}/> Info Penggalang Dana</h3>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Nama Lengkap</p>
              <p className="text-base font-bold text-gray-800">{campaign.full_name}</p>
              {/* Tambahkan tag Tipe Akun untuk memperjelas admin */}
              <p className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded w-max font-bold mt-1 uppercase tracking-widest">
                {isOrganization ? "Organisasi/Lembaga" : "Individu"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Dibuat Pada</p><p className="text-xs font-medium text-gray-700 mt-1">{formatDate(campaign.created_at)}</p></div>
            </div>
          </div>

          {/* KARTU AKSI ADMIN */}
          <div className="bg-gray-800 p-6 rounded-[2rem] shadow-lg text-white">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Keputusan Admin</h3>
            {isPending && (
              <div className="space-y-3">
                <button onClick={() => setIsApproveModalOpen(true)} className="w-full flex justify-center items-center gap-2 bg-green-500 hover:bg-green-400 font-bold py-3 px-4 rounded-xl transition"><CheckCircle2 size={18} /> Setujui & Tayangkan</button>
                <button onClick={() => { setActionType("reject"); setIsRejectModalOpen(true); }} className="w-full flex justify-center items-center gap-2 bg-white/10 hover:bg-red-500 font-bold py-3 px-4 rounded-xl transition"><XCircle size={18} /> Tolak Kampanye</button>
              </div>
            )}
            {isActive && (
              <button onClick={() => { setActionType("suspend"); setIsRejectModalOpen(true); }} className="w-full flex justify-center items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold py-3 px-4 rounded-xl transition"><Ban size={18} /> Suspend / Tangguhkan</button>
            )}
            {isRejected && (
              <button onClick={() => setIsApproveModalOpen(true)} className="w-full flex justify-center items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl transition"><CheckCircle2 size={18} className="text-green-500" /> Tinjau Ulang (Setujui)</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}