"use client"; // 🔥 WAJIB ADA DI BARIS PERTAMA

import { useState, useEffect, useRef } from "react";
import { Bell, Check } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Tipe Data Notifikasi
interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  leadId?: string; 
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. Fetch Data Notifikasi
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/notifications");
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      // console.error("Gagal mengambil notifikasi:", error);
    }
  };

  // Fetch saat mount & pasang interval polling (Realtime sederhana)
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 60000); // Cek tiap 60 detik
    return () => clearInterval(interval);
  }, []);

  // 2. Handle Klik di Luar (Tutup dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Mark All as Read
  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await apiClient.post("/notifications/read-all");
      // Update UI Optimistik (langsung jadi 'read' di layar user)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Gagal mark all read");
      fetchNotifications(); // Rollback jika gagal
    } finally {
      setLoading(false);
    }
  };

  // 4. Klik Satu Notifikasi (Baca & Navigasi)
  const handleNotificationClick = async (notif: Notification) => {
    // A. Navigasi
    if (notif.leadId) {
      router.push(`/lead/${notif.leadId}`);
      setIsOpen(false);
      
      // Refresh data halaman tujuan (penting jika navigasi ke halaman yang sama/sudah terbuka)
      setTimeout(() => {
         router.refresh();
      }, 100);
    }

    // B. Mark Read di Background (jika belum dibaca)
    if (!notif.isRead) {
      try {
        // Update UI lokal dulu biar badge berkurang instan
        setNotifications((prev) => 
            prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Request API
        await apiClient.patch(`/notifications/${notif.id}/read`);
      } catch (err) {
        console.error(err);
        fetchNotifications(); // Sinkron ulang jika error
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* --- TOMBOL LONCENG --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white dark:bg-[#3B3285] transition text-gray-600 dark:text-gray-300 hover:text-[#5A4FB5] dark:hover:text-[#CAA9FF]"
      >
        <Bell size={18} />
        
        {/* Badge Merah */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#3B3285]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* --- DROPDOWN MENU --- */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#3B3285] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          
          {/* Header Dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#322b72]">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs text-[#5A4FB5] dark:text-[#CAA9FF] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <Bell size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`px-4 py-3 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-[#2D3748] flex gap-3 ${
                      !item.isRead 
                        ? "bg-blue-50/40 dark:bg-[#5A4FB5]/20"
                        : "bg-white dark:bg-[#3B3285]" 
                    }`}
                  >
                    {/* Indikator Belum Dibaca */}
                    <div className="mt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${!item.isRead ? "bg-[#5A4FB5]" : "bg-gray-200 dark:bg-gray-600"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Judul */}
                      <p className={`text-sm truncate ${
                        !item.isRead 
                          ? "font-semibold text-gray-800 dark:text-white" 
                          : "text-gray-600 dark:text-gray-300"
                      }`}>
                        {item.title || "Notification"}
                      </p>
                      
                      {/* Pesan */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      
                      {/* Waktu */}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                        {new Date(item.createdAt).toLocaleString('id-ID', { 
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Dropdown */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#322b72] text-center">
            <Link 
              href="/notifications"
              onClick={() => setIsOpen(false)} 
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#5A4FB5] dark:hover:text-[#CAA9FF] transition font-medium block w-full"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}