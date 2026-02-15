"use client";

import { Check, ChevronDown, Trash2, ChevronLeft, UserPlus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import ConfirmationModal from "./ConfirmationModal";

type LeadHeaderProps = {
  lead: any;
  onRefresh: () => void;
};

export function LeadHeader({ lead, onRefresh }: LeadHeaderProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Sinkronisasi data saat refresh
  useEffect(() => {
    setTitle(lead.title || "");
    setStage(lead.stage || "Lead In");
  }, [lead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Status stages yang lengkap
  const statuses = ["Lead In", "Contact Mode", "Need Identified", "Proposal Made", "Negotiation", "Contract Sent", "Won", "Lost"];
  
  // Mapping Status ke Progress Bar Index
  const getCurrentStatusIndex = () => {
    // Gunakan lead.stage karena di Kanban kita pakai 'stage', bukan 'status' enum
    return statuses.indexOf(lead.stage || "Lead In");
  };

  // Fungsi yang dipicu tombol centang di Header
const triggerSave = () => {
  setShowSaveConfirm(true);
};

// Fungsi yang dipicu tombol "Confirm" di dalam Modal
const handleSaveChanges = async () => {
  try {
    setIsSaving(true);
    setShowSaveConfirm(false); // Tutup modal setelah konfirmasi
    
    const payload: any = { 
      title: title, 
      stage: stage,
      status: stage === 'Won' ? 'WON' : stage === 'Lost' ? 'LOST' : 'ACTIVE'
    };

    await apiClient.patch(`/leads/${lead.id}`, payload);
    onRefresh(); 
  } catch (error) {
    console.error("Failed to save:", error);
    alert("Failed to save changes.");
  } finally {
    setIsSaving(false);
  }
};

  // UPDATE STATUS / STAGE
  const handleStageChange = async (newStage: string) => {
    try {
      setStatusLoading(false);
      // Kirim 'stage' bukan 'status' jika mengikuti logika Kanban
      // Tapi jika logic backend update stage juga mengupdate status enum, ini aman.
      await apiClient.patch(`/leads/${lead.id}`, { stage: newStage });
      setDropdownOpen(false);
      onRefresh(); // Refresh data parent
    } catch (error) {
      console.error("Failed to update stage:", error);
      alert("Failed to update stage");
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
      console.error("Failed to delete lead:", error);
      alert("Failed to delete lead. Make sure you are the Owner or Admin.");
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
      console.error("Failed to follow/unfollow:", error);
      alert("Failed to change follow status.");
    } finally {
    }
  }

  return (
    <>
      {/* Back Link */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 cursor-pointer w-fit text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">Back to Leads</span>
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
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
                className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#5A4FB5] focus:outline-none transition-all px-0 resize-none overflow-hidden leading-tight break-words"
                placeholder="Enter Lead Title..."
                style={{ minHeight: '36px' }} 
            />
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-6 h-6 bg-[#5A4FB5] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                {(lead.owner?.fullName || "U").charAt(0).toUpperCase()}
              </div>
              <span>{lead.owner?.fullName || "No Owner"}</span>
              {lead.followers?.length > 0 && (
                <span className="text-gray-400">({lead.followers.length})</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap">
            {/* Follow Button */}
            <button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium border ${
                    isFollowed 
                    ? "bg-white dark:bg-gray-800 text-[#5A4FB5] border-[#5A4FB5] hover:bg-[#5A4FB5]/5" 
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
            >
              {followLoading ? (
                 <Loader2 className="animate-spin h-4 w-4" />
              ) : isFollowed ? (
                 <>Following <ChevronDown className="w-3 h-3" /></>
              ) : (
                 <>Follow <UserPlus className="w-4 h-4" /></>
              )}
            </button>

            {/* STATUS DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={statusLoading}
                className="bg-[#5A4FB5] text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-70 hover:bg-[#4a4194] transition-all text-sm font-medium"
              >
                {statusLoading ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <>{lead.stage || "Select Stage"}<ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} /></>
                )}
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStageChange(s)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors ${
                        s === lead.stage 
                          ? "text-[#5A4FB5] font-semibold bg-[#5A4FB5]/5" 
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span>{s}</span>
                      {s === lead.stage && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SAVE BUTTON */}
            <button 
              onClick={triggerSave}
              disabled={isSaving}
              title="Save Changes"
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                isSaving 
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[#5A4FB5] hover:text-[#5A4FB5]"
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Check size={16} />}
            </button>

            {/* DELETE BUTTON */}
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              title="Delete Lead"
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR (Status Pipeline) */}
        <div className="flex gap-1">
          {statuses.map((status, index) => {
            const currentIndex = getCurrentStatusIndex();
            const isActive = index === currentIndex;
            const isPassed = index < currentIndex;
            
            let bgClass = "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500";
            if (isPassed) bgClass = "bg-[#5A4FB5]/15 text-[#5A4FB5] dark:bg-[#5A4FB5]/20";
            if (isActive) {
                if (status === "Won") bgClass = "bg-green-500 text-white";
                else if (status === "Lost") bgClass = "bg-red-500 text-white";
                else bgClass = "bg-[#5A4FB5] text-white";
            }
            
            return (
              <button
                key={status}
                onClick={() => handleStageChange(status)}
                className={`flex-1 rounded-lg px-1.5 py-2 text-center text-[10px] md:text-[11px] font-medium transition-all cursor-pointer hover:opacity-80 flex items-center justify-center gap-1 ${bgClass}`}
              >
                {(isPassed || isActive) && <Check className="w-3 h-3 hidden md:block" />}
                <span className="hidden sm:inline truncate">{status}</span>
                <span className="sm:hidden">{status.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ConfirmationModal
        open={showDeleteConfirm}
        type="delete"
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      <ConfirmationModal
  open={showSaveConfirm}
  type="save" // Pastikan komponen modal Anda mendukung type "save"
  onClose={() => setShowSaveConfirm(false)}
  onConfirm={handleSaveChanges}
/>
    </>
  );
}