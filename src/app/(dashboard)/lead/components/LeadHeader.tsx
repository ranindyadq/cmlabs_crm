"use client";

import { Check, ChevronDown, Trash2, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import ConfirmationModal from "./ConfirmationModal";

type LeadHeaderProps = {
  lead: any;
  onRefresh: () => void;
};

export function LeadHeader({ lead, onRefresh }: LeadHeaderProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Status stages yang lengkap
  const statuses = ["NEW", "QUALIFIED", "NEGOTIATION", "WON", "LOST"];
  
  // Helper untuk get index status saat ini
  const getCurrentStatusIndex = () => {
    return statuses.indexOf(lead.status);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      await apiClient.patch(`/leads/${lead.id}`, { status: newStatus });
      setDropdownOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/leads/${lead.id}`);
      router.push("/leads");
    } catch (error) {
      console.error("Gagal hapus lead:", error);
      alert("Gagal menghapus lead");
    }
  };

  return (
    <>
      {/* Tombol Back */}
      <div onClick={() => router.back()} className="flex items-center gap-2 cursor-pointer w-fit mb-0">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Back to Leads</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex flex-col gap-3 transition-colors">
        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg dark:text-white">{lead.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
                👤
              </span>
              {lead.owner?.fullName || "No Owner"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Following */}
            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-full flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm">
              Following <Check className="w-4 h-4" />
            </button>

            {/* STATUS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={loading}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-full flex items-center gap-2 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
              >
                {loading ? "Updating..." : lead.status}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-10 right-0 w-40 bg-white dark:bg-gray-800 shadow-xl rounded-md border dark:border-gray-700 z-20">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors ${
                        s === lead.status ? "text-[#5A4FB5] font-semibold bg-gray-50 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {s}
                      {s === lead.status && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checkmark Button */}
            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <Check className="w-5 h-5" />
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

        {/* PROGRESS BAR dengan Stages sesuai mockup */}
        <div className="flex gap-2 mt-1">
          {statuses.map((status, index) => {
            const currentIndex = getCurrentStatusIndex();
            const isActive = index === currentIndex;
            const isPassed = index < currentIndex;
            const isFuture = index > currentIndex;
            
            return (
              <div
                key={status}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-900 dark:bg-gray-700 text-white"
                    : isPassed
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}
              >
                {isActive && <Check className="w-3 h-3 inline mr-1" />}
                {status === "QUALIFIED" ? "Qualified" : 
                 status === "NEGOTIATION" ? "Negotiation" : 
                 status === "NEW" ? "New" :
                 status === "WON" ? "Won" :
                 status === "LOST" ? "Lost" :
                 "Status"}
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