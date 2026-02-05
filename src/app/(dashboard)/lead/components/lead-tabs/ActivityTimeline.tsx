"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Phone, NotebookPen, Filter, Plus, X, Video, Mail, FileText, Receipt } from "lucide-react";

export default function ActivityTimeline({ 
  leadId, 
  onRefresh 
}: { 
  leadId: string; 
  onRefresh?: () => void;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // 1. FETCH SEMUA AKTIVITAS
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      // Kita panggil detail lead, backend biasanya sudah include relasi (notes, meetings, dll)
      // Jika backend Anda memisahkan, Anda mungkin perlu Promise.all() ke beberapa endpoint.
      // Di sini saya asumsikan endpoint GET /leads/[id] sudah include semuanya sesuai controller Anda.
      const res = await apiClient.get(`/leads/${leadId}`);
      const data = res.data.data;

      // 2. MERGE & SORT DATA
      // Kita gabungkan semua array aktivitas menjadi satu list
      const combined = [
        ...(data.notes || []).map((i: any) => ({ ...i, type: "NOTE", date: i.createdAt })),
        ...(data.meetings || []).map((i: any) => ({ ...i, type: "MEETING", date: i.startTime })),
        ...(data.calls || []).map((i: any) => ({ ...i, type: "CALL", date: i.callTime })),
        ...(data.emails || []).map((i: any) => ({ ...i, type: "EMAIL", date: i.sentAt })),
        ...(data.activities || []).map((i: any) => ({ 
            ...i, 
            type: i.type, // "INVOICE_CREATED", "LOG", dll
            date: i.createdAt,
            title: i.type === 'INVOICE_CREATED' ? 'Invoice Created' : 'Activity Log' 
        })),
      ];

      // Sort Descending (Terbaru di atas)
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(combined);
    } catch (error) {
      console.error("Gagal ambil timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchTimeline();
  }, [leadId]);

  // Helper untuk Icon
  const getIcon = (type: string) => {
    switch (type) {
      case "NOTE": return <NotebookPen className="w-4 h-4" />;
      case "MEETING": return <Video className="w-4 h-4" />;
      case "CALL": return <Phone className="w-4 h-4" />;
      case "EMAIL": return <Mail className="w-4 h-4" />;
      case "INVOICE_CREATED": return <Receipt className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <button className="flex items-center gap-2 border rounded-md px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 transition">
          <Filter className="w-4 h-4" /> Filters
        </button>
        {/* Tombol Add bisa dibuat dropdown untuk memilih jenis aktivitas, atau buka popup general */}
      </div>

      {/* TIMELINE LIST */}
      {loading ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">Loading timeline...</p>
      ) : activities.length === 0 ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">No activities found.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((item, idx) => (
            <div key={item.id || idx} className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <span className="bg-[#EBE9FE] dark:bg-[#5A4FB5]/20 text-[#5A4FB5] p-1.5 rounded-full">
                    {getIcon(item.type)}
                  </span>
                  {item.title || item.subject || "No Title"}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(item.date).toLocaleString()}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-9">
                  {/* Tampilkan deskripsi atau konten berdasarkan tipe */}
                  {item.type === "NOTE" && item.content}
                  {item.type === "MEETING" && (
                    <div>
                      <p>{item.description}</p>
                      {/* Tampilkan Link & Lokasi di Timeline */}
                      <div className="flex gap-2 mt-1 text-[10px]">
                        {item.location && <span className="bg-gray-100 px-1 rounded">📍 {item.location}</span>}
                        {item.meetingLink && <a href={item.meetingLink} target="_blank" className="text-blue-500 hover:underline">🔗 Join Meeting</a>}
                      </div>
                    </div>
                  )}
                  {item.type === "CALL" && item.notes}
                  {item.type === "EMAIL" && item.body}
                  {item.type === "INVOICE_CREATED" && (
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.description}
                    </span>
                  )}
              </p>
              
              {/* Info Tambahan Kecil */}
              <div className="ml-9 flex gap-2">
                 <span className="text-[10px] bg-white dark:bg-gray-900 border dark:border-gray-700 px-2 rounded text-gray-500 dark:text-gray-400">
                    {item.type}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}