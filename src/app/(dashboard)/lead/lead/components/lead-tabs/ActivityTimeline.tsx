"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Phone, NotebookPen, Video, Mail, FileText, Receipt, User } from "lucide-react";

export default function ActivityTimeline({ 
  leadId, 
  onRefresh,
  filterType = "ALL",
  searchQuery = ""
}: { 
  leadId: string; 
  onRefresh?: () => void;
  filterType?: string;
  searchQuery?: string;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");

  // 1. FETCH SEMUA AKTIVITAS
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}`);
      const data = res.data.data;

      // 2. MERGE & SORT DATA
      const combined = [
        ...(data.notes || []).map((i: any) => ({ 
          ...i, 
          type: "NOTE", 
          date: i.createdAt, 
          createdBy: i.user // Mapping agar seragam
        })),
        ...(data.meetings || []).map((i: any) => ({ ...i, type: "MEETING", date: i.startTime })),
        ...(data.calls || []).map((i: any) => ({ ...i, type: "CALL", date: i.callTime })),
        ...(data.emails || []).map((i: any) => ({ ...i, type: "EMAIL", date: i.sentAt })),
        ...(data.invoices || []).map((i: any) => ({ 
            ...i, 
            type: "INVOICE_CREATED", 
            // Gunakan invoiceDate sebagai referensi waktu utama
            date: i.invoiceDate, 
            title: `Invoice #${i.invoiceNumber}`, 
            description: i.notes || `Total: ${i.totalAmount}`
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

  // Helper untuk Label Type
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "NOTE": return "Meeting notes";
      case "MEETING": return "Meeting";
      case "CALL": return "[Sample] Final contact attempt";
      case "EMAIL": return "Email sent";
      case "INVOICE_CREATED": return "Invoice created";
      default: return "Activity";
    }
  };

  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A4FB5] border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No activities found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Activities will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities
            .filter((item) => {
              // 1. Filter berdasarkan Tipe (Dropdown Filter)
              const matchesType = filterType === "ALL" || item.type === filterType;
              
              // 2. Filter berdasarkan Teks (Search Bar)
              const query = searchQuery.toLowerCase();
              const matchesSearch = 
                (item.title?.toLowerCase() || "").includes(query) ||
                (item.content?.toLowerCase() || "").includes(query) ||
                (item.subject?.toLowerCase() || "").includes(query) ||
                (item.description?.toLowerCase() || "").includes(query) ||
                (item.notes?.toLowerCase() || "").includes(query);

              return matchesType && matchesSearch;
            })
            .map((item, idx) => (
            <div 
              key={item.id || idx} 
              className="rounded-lg p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all bg-white dark:bg-gray-800/50"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Title/Type - SESUAI WIREFRAME */}
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {item.title || item.subject || getTypeLabel(item.type)}
                  </h4>
                  
                  {/* Date/Time & Author dalam 1 baris - SESUAI WIREFRAME */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatDateTime(item.date)}
                    {item.createdBy?.fullName && ` ${item.createdBy.fullName}`}
                  </p>

                  {/* Avatar + Nama User - SESUAI WIREFRAME */}
                  {item.createdBy && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-black dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.createdBy.fullName}
                      </span>
                    </div>
                  )}
                  
                  {/* Content/Description - SESUAI WIREFRAME */}
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {item.type === "NOTE" && <p>{item.content}</p>}
                    
                    {item.type === "MEETING" && (
                      <div>
                        <p>{item.description}</p>
                        {(item.location || item.meetingLink) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.location && (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                📍 {item.location}
                              </span>
                            )}
                            {item.meetingLink && (
                              <a 
                                href={item.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                              >
                                🔗 Join Meeting
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {item.type === "CALL" && <p>{item.notes}</p>}
                    {item.type === "EMAIL" && <p>{item.body}</p>}
                    {item.type === "INVOICE_CREATED" && (
                    <div className="mt-2">
                      <p>{item.description}</p>
                      <div className="mt-1 font-bold text-[#5A4FB5]">
                        Amount: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.totalAmount)}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}