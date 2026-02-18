"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { 
  Phone, ChevronUp, ChevronDown, Calendar, 
  MoreHorizontal, X, Clock, Trash2, Edit, CheckCircle, ArrowRight
} from "lucide-react";
import ConfirmationModal from "../ConfirmationModal";

interface CallTabProps {
  leadId: string;
  onRefresh?: () => void;
  showForm?: boolean;
  setShowForm?: (val: boolean) => void;
  filterType?: string;
  searchQuery?: string;
}

export default function CallTab({ 
  leadId, 
  onRefresh,
  showForm,
  setShowForm,
  filterType,
  searchQuery
}: CallTabProps) {
  // === STATE ===
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // State untuk Edit Mode
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null); // State untuk Delete Confirmation

  // Form State
  const [callTitle, setCallTitle] = useState("");
  const [callDirection, setCallDirection] = useState("");
  const [callDate, setCallDate] = useState(""); // Format: YYYY-MM-DD
  const [callTime, setCallTime] = useState(""); // Format: HH:mm
  const [duration, setDuration] = useState("15"); // String untuk select option
  const [callStatus, setCallStatus] = useState("SCHEDULED");
  const [callResult, setCallResult] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [contacts, setContacts] = useState<any[]>([]); 
  const [selectedContactId, setSelectedContactId] = useState("");

  const maxChars = 500;
  const isModalOpen = showForm || false;

  // === FETCH DATA ===
  const fetchCalls = async () => {
    try {
      setLoading(true);
      // Menggunakan GET yang diasumsikan ada di route leads/[id]/calls
      const res = await apiClient.get(`/leads/${leadId}/calls`);
      setCalls(res.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data call:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. TAMBAH FUNGSI FETCH CONTACTS
  const fetchContacts = async () => {
    try {
      const res = await apiClient.get(`/leads/${leadId}`);
      const leadData = res.data?.data;

      // PERBAIKAN LOGIKA:
      // Cek apakah backend mengirim list 'contacts' (banyak) atau satu 'contact' (tunggal)
      if (leadData?.contacts && Array.isArray(leadData.contacts)) {
        setContacts(leadData.contacts);
      } else if (leadData?.contact) {
        // Jika cuma ada 1 kontak (single object), kita bungkus jadi array
        setContacts([leadData.contact]); 
      } else {
        setContacts([]);
      }
    } catch (e) {
      console.error("Gagal ambil kontak", e);
    }
  };
  useEffect(() => {
    if (leadId) {
      fetchCalls();
      fetchContacts();
    }// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // === HANDLERS ===
  
  // Reset Form
  const handleClose = () => {
    setEditingId(null);
    setCallTitle("");
    setCallDirection("");
    setCallDate("");
    setCallTime("");
    setDuration("15");
    setCallStatus("SCHEDULED");
    setCallResult("");
    setCallNotes("");
    setSelectedContactId("");
    if (setShowForm) setShowForm(false);
  };

  // Populate Form untuk Edit
  const handleEdit = (call: any) => {
    setEditingId(call.id);
    
    setCallTitle(call.title || "");
    setCallDirection(call.direction || "");
    setCallStatus(call.status || "SCHEDULED");
    setCallResult(call.result || "");
    setCallNotes(call.notes || "");
    setDuration(call.durationMinutes ? String(call.durationMinutes) : "15");
    setSelectedContactId(call.contactId || "");

    // Pisahkan ISO String menjadi Date & Time untuk input HTML
    if (call.callTime) {
        const d = new Date(call.callTime);
        setCallDate(d.toISOString().split('T')[0]); // YYYY-MM-DD
        
        // Ambil jam lokal HH:mm
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setCallTime(`${hours}:${minutes}`);
    }

    if (setShowForm) setShowForm(true);
  };

  // Create & Update Handler
  const handleSubmit = async () => {
    if (!callTitle) return alert("Call title is required");
    if (!callDate || !callTime) return alert("Date and Time are required");

    setSubmitting(true);
    try {
      // 1. Gabungkan Tanggal & Waktu jadi ISO String
      const dateTimeString = `${callDate}T${callTime}:00`;
      const isoDateTime = new Date(dateTimeString).toISOString();

      // 2. Siapkan Payload yang BERSIH
      const payload = {
        title: callTitle,
        contactId: selectedContactId || "", // API akan mengubah "" menjadi null
        
        // Kirim nama field yang sesuai dengan Schema Prisma atau logic API
        callTime: isoDateTime, // API mengharapkan field ini untuk disimpan ke db
        durationMinutes: parseInt(duration), // Ubah String ke Integer!
        
        direction: callDirection || null,
        status: callStatus,
        result: callResult || null,
        notes: callNotes,
      };

      if (editingId) {
        await apiClient.patch(`/calls/${editingId}`, payload);
        alert("Call log updated!");
      } else {
        await apiClient.post(`/leads/${leadId}/calls`, payload);
        alert("Call log created!");
      }

      handleClose();
      fetchCalls();
      onRefresh?.();
    } catch (error: any) {
      console.error("Submit Error:", error.response?.data || error);
      alert(`Failed to save: ${error.response?.data?.message || "Check console"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler - Open Confirmation Modal
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
        await apiClient.delete(`/calls/${deleteConfirmId}`);
        fetchCalls();
        onRefresh?.();
    } catch (err) {
        alert("Failed to delete call log");
    } finally {
        setDeleteConfirmId(null);
    }
  };

  // Helper Format Tanggal Tampilan
  const formatDisplayDate = (isoString: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', 
        hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  // 1. Logika Filter & Search di dalam komponen CallTab
const filteredCalls = calls.filter((call) => {
  // A. Logika Search (Judul, Catatan, atau Hasil)
  const query = searchQuery?.toLowerCase() || "";
  const matchesSearch = 
    (call.title?.toLowerCase() || "").includes(query) ||
    (call.notes?.toLowerCase() || "").includes(query) ||
    (call.result?.toLowerCase() || "").includes(query);

  // B. Logika Filter Kategori (INBOUND / OUTBOUND)
  let matchesFilter = true;
  if (filterType === "INBOUND") {
    matchesFilter = call.direction === "INBOUND";
  } else if (filterType === "OUTBOUND") {
    matchesFilter = call.direction === "OUTBOUND";
  }

  return matchesSearch && matchesFilter;
});

  return (
    <div>
      {/* LIST CALLS - SESUAI WIREFRAME SEBELUMNYA */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A4FB5] border-t-transparent" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <Phone className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No call logs found</p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div 
              key={call.id} 
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm group"
            >
              {/* Header Card */}
              <div 
                className="px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
              >
                <div className="flex items-center gap-3">
                  <button className="text-gray-400 hover:text-gray-600 transition">
                    {expandedId === call.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      call.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                      call.status === 'MISSED' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                  }`}>
                    {call.direction === 'INBOUND' ? <ArrowRight size={14} className="rotate-180"/> : <Phone size={14} />}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {call.title || "(No Title)"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {call.durationMinutes} mins • {call.direction || "Outbound"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar size={14} />
                    <span className="text-xs">{formatDisplayDate(call.callTime)}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(call); }} 
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 rounded transition"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(call.id); }} 
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded transition"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === call.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {call.notes || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                        <span className="text-gray-500 block">Result</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{call.result || "-"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Status</span>
                        <span className={`font-medium ${
                            call.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'
                        }`}>{call.status}</span>
                    </div>
                     <div>
                        <span className="text-gray-500 block">Direction</span>
                        <span className={`font-medium ${
                          call.direction === 'INBOUND' ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {/* Ubah INBOUND jadi Inbound */}
                          {call.direction 
                            ? call.direction.charAt(0) + call.direction.slice(1).toLowerCase() 
                            : "-"}
                        </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL ADD NEW CALL - SESUAI WIREFRAME BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Call" : "Add New Call"}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-0 space-y-2">
              
              {/* Call Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Title</label>
                <input
                  type="text"
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  placeholder="Enter Call Title"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition placeholder:text-gray-400"
                />
              </div>

              {/* Row: Contact Name & Direction */}
              <div className="grid grid-cols-2 gap-6">
                {/* KOLOM 1: Contact Name + Error Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Name
                  </label>
                  <div className="relative">
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white text-gray-700"
                    >
                      <option value="">Select Contact...</option>
                      {contacts.length > 0 ? (
                        contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} {contact.jobTitle ? `(${contact.jobTitle})` : ""}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No contacts available
                        </option>
                      )}
                    </select>
                    
                    {/* Icon Panah Dropdown */}
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Tampilkan pesan error DI SINI (Masih di dalam kolom 1) */}
                  {contacts.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      * No contacts found. Please add a contact first.
                    </p>
                  )}
                </div>

                {/* KOLOM 2: Call Direction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Call Direction
                  </label>
                  <div className="relative">
                    <select
                      value={callDirection}
                      onChange={(e) => setCallDirection(e.target.value)}
                      className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white text-gray-600"
                    >
                      <option value="">Choose Call Direction</option>
                      <option value="INBOUND">Inbound</option> 
                      <option value="OUTBOUND">Outbound</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              {/* Row: Date, Time, Duration (3 Cols) */}
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Date</label>
                    <div className="relative">
                        <input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none text-gray-600" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Time</label>
                    <div className="relative">
                        <input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none text-gray-600" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                    <div className="relative">
                        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white text-gray-600">
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">1 Hour</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
              </div>

              {/* Row: Status & Result */}
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Status</label>
                    <div className="relative">
                        <select value={callStatus} onChange={(e) => setCallStatus(e.target.value)} className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white text-gray-600">
                            <option value="">Choose status</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="MISSED">Missed</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Result</label>
                    <div className="relative">
                        <select value={callResult} onChange={(e) => setCallResult(e.target.value)} className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white text-gray-600">
                            <option value="">Choose result</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow Up">Follow Up</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
              </div>

              {/* Notes */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Notes</label>
                 <div className="relative">
                    <textarea
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value.slice(0, maxChars))}
                        rows={3}
                        placeholder="Enter Call Notes"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none placeholder:text-gray-400"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                        {callNotes.length}/{maxChars}
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer */}
             <div className="flex justify-center px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#5A4FB5] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#483d96] disabled:opacity-50 transition"
              >
                {submitting ? (editingId ? "Updating..." : "Saving...") : (editingId ? "Save Call" : "Add New Call")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deleteConfirmId}
        type="delete"
        title="Delete Call Log?"
        desc="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}