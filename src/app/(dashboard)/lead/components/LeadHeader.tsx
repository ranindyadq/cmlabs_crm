"use client";

import { Check, ChevronDown, Trash2, ChevronLeft, UserPlus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import ConfirmationModal from "./ConfirmationModal";

type LeadHeaderProps = {
  lead: any;
  onRefresh: () => void;
};

export function LeadHeader({ lead, onRefresh }: LeadHeaderProps) {
  const router = useRouter();

  // State Lokal untuk Field di Header (Agar bisa diedit)
  const [title, setTitle] = useState(lead.title || "");
  const [stage, setStage] = useState(lead.stage || "Lead In");

  // State Loading terpisah agar UX lebih enak
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sinkronisasi data saat refresh
  useEffect(() => {
    setTitle(lead.title || "");
    setStage(lead.stage || "Lead In");
  }, [lead]);
  
  // Status stages yang lengkap
  const statuses = ["Lead In", "Contact Mode", "Need Identified", "Proposal Made", "Negotiation", "Contract Sent", "Won", "Lost"];
  
  // Mapping Status ke Progress Bar Index
  const getCurrentStatusIndex = () => {
    // Gunakan lead.stage karena di Kanban kita pakai 'stage', bukan 'status' enum
    return statuses.indexOf(lead.stage || "Lead In");
  };

  // FUNGSI SAVE UTAMA (Dipanggil Tombol Centang)
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      const payload: any = { 
        title: title, 
        stage: stage,
        // Sinkronisasi status Enum backend
        status: stage === 'Won' ? 'WON' : stage === 'Lost' ? 'LOST' : 'ACTIVE'
      };

      await apiClient.patch(`/leads/${lead.id}`, payload);
      onRefresh(); 
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  // UPDATE STATUS / STAGE
  const handleStageChange = async (newStage: string) => {
    try {
      setStatusLoading(true);
      // Kirim 'stage' bukan 'status' jika mengikuti logika Kanban
      // Tapi jika logic backend update stage juga mengupdate status enum, ini aman.
      await apiClient.patch(`/leads/${lead.id}`, { stage: newStage });
      setDropdownOpen(false);
      onRefresh(); // Refresh data parent
    } catch (error) {
      console.error("Gagal update stage:", error);
      alert("Gagal update stage");
    } finally {
      setStatusLoading(true);
    }
  };

  // 2. DELETE LEAD
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/leads/${lead.id}`);
      // Redirect ke halaman list setelah hapus
      router.push("/lead"); 
    } catch (error) {
      console.error("Gagal hapus lead:", error);
      alert("Gagal menghapus lead. Pastikan Anda adalah Owner atau Admin.");
    } finally {
      setIsDeleting(true);
    }
  };

  // 3. FOLLOW / UNFOLLOW (Fitur Baru)
  const isFollowed = lead.isFollowed; // Property ini dikirim dari backend GET /leads/[id]

  const handleFollowToggle = async () => {
    try {
      if (isFollowed) {
        // Unfollow
        await apiClient.delete(`/leads/${lead.id}/unfollow`);
      } else {
        // Follow
        await apiClient.post(`/leads/${lead.id}/follow`);
      }
      onRefresh(); // Refresh agar UI tombol berubah
    } catch (error) {
      console.error("Gagal follow/unfollow:", error);
      alert("Gagal mengubah status follow.");
    } finally {
    }
  }

  return (
    <>
      {/* Tombol Back */}
      <div onClick={() => router.back()} className="flex items-center gap-2 cursor-pointer w-fit -mb-1">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Back to Leads</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 -mb-2">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 w-full min-w-0">
            {/* INPUT JUDUL (EDITABLE) */}
            <textarea
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                ref={(ref) => {
                    if (ref) {
                        ref.style.height = "auto";
                        ref.style.height = `${ref.scrollHeight}px`;
                    }
                }}
                rows={1}
                className="text-lg md:text-lg font-semibold text-gray-900 dark:text-white mb-0 w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#5A4FB5] focus:outline-none transition-all px-0 resize-none overflow-hidden leading-tight break-words"
                placeholder="Enter Lead Title..."
                style={{ minHeight: '36px' }} 
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                👤
              </span>
              {lead.owner?.fullName || "No Owner"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap md:flex-nowrap">
            {/* Tombol Following */}
            <button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition text-sm font-medium border ${
                    isFollowed 
                    ? "bg-[#5A4FB5]/10 text-[#5A4FB5] border-[#5A4FB5]/20 hover:bg-[#5A4FB5]/20" 
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50"
                }`}
            >
              {followLoading ? (
                 <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : isFollowed ? (
                 <>Following <Check className="w-4 h-4" /></>
              ) : (
                 <>Follow <UserPlus className="w-4 h-4" /></>
              )}
            </button>

            {/* STATUS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={statusLoading}
                className="bg-[#5A4FB5] text-white px-5 py-2 rounded-full flex items-center gap-2 disabled:opacity-70 hover:bg-[#4a4194] transition text-sm font-medium shadow-sm shadow-purple-200 dark:shadow-none"
              >
                {statusLoading ? "Updating..." : (lead.stage || "Select Stage")}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStageChange(s)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors ${
                        s === lead.stage ? "text-[#5A4FB5] font-semibold bg-purple-50 dark:bg-gray-700/50" : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {s}
                      {s === lead.stage && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TOMBOL SAVE (CENTANG) */}
            <button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              title="Save Changes"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                isSaving 
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Check size={18} />}
            </button>

            {/* Delete Button */}
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-full hover:bg-red-600 hover:text-white transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR (Status Pipeline) */}
        <div className="hidden md:flex gap-1 mt-2">
          {statuses.map((status, index) => {
            const currentIndex = getCurrentStatusIndex();
            const isActive = index === currentIndex;
            const isPassed = index < currentIndex;
            
            // Logic Warna: 
            // - Passed: Ungu Pudar
            // - Active: Ungu Tebal
            // - Future: Abu-abu
            // - Won: Hijau, Lost: Merah (Jika aktif)
            
            let bgClass = "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500";
            if (isPassed) bgClass = "bg-[#5A4FB5]/30 text-[#5A4FB5] dark:bg-[#5A4FB5]/20";
            if (isActive) {
                if (status === "Won") bgClass = "bg-green-500 text-white";
                else if (status === "Lost") bgClass = "bg-red-500 text-white";
                else bgClass = "bg-[#5A4FB5] text-white";
            }
            
            return (
              <div
                key={status}
                onClick={() => handleStageChange(status)} // Klik progress bar bisa ganti status juga
                className={`flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-semibold transition-all cursor-pointer hover:opacity-80 ${bgClass}`}
              >
                {status}
              </div>
            );
          })}
        </div>

        <ConfirmationModal
          open={showDeleteConfirm}
          type="delete"
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      </div>
    </>
  );
}