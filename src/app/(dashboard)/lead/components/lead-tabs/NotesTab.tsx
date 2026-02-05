"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Plus, Trash2, Calendar, FileText, Edit, ImageIcon } from "lucide-react";

// Tambah props showForm & setShowForm dari parent
  export default function NotesTab({ 
    leadId, 
    onRefresh,
    showForm,    // Tambahkan ini
    setShowForm  // Tambahkan ini
  }: { 
    leadId: string; 
    onRefresh?: () => void;
    showForm: boolean;      // Tambahkan tipe
    setShowForm: (val: boolean) => void; // Tambahkan tipe
  }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tambah state untuk date & title
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  
  // Character counter
  const maxChars = 500;
  const charCount = content.length;

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}?activity_type=NOTE`);
      setNotes(res.data.data.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchNotes();
  }, [leadId]);

  const handleCreate = async () => {
    if (!content.trim()) {
      alert("Deskripsi tidak boleh kosong");
      return;
    }
    
    setSubmitting(true);
    try {
      // Sesuaikan dengan backend route /api/notes/[leadId]
      const payload = {
        content: content.trim(),
        title: title.trim() || "Note",
      };
      
      console.log("Sending payload:", payload);
      console.log("To endpoint:", `/notes/${leadId}`);
      
      // Gunakan endpoint /api/notes/[leadId] sesuai backend
      const response = await apiClient.post(`/leads/${leadId}/notes`, payload);
      
      console.log("Response:", response);
      
      // Reset semua form fields
      setContent("");
      setTitle("");
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      fetchNotes();
      
    } catch (err: any) {
      console.error("Error creating note:", err);
      console.error("Error response:", err.response?.data);
      
      // Tampilkan error detail
      const errorMessage = err.response?.data?.message || err.message || "Gagal membuat note";
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    try {
      await apiClient.delete(`/notes/${noteId}`);
      fetchNotes();
    } catch (err) {
      alert("Gagal menghapus note");
    }
  };

  return (
    <div className="space-y-4">
      {/* Modal Add Note sesuai mockup */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md relative">
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Add New Note</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Form Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Date Created - Bisa dipilih */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Date Created
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
                  />
                </div>
              </div>

              {/* Description - Tambah maxLength */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={maxChars}
                  placeholder="Enter Lead Description"
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-[#5A4FB5] outline-none resize-none"
                />
              </div>

              {/* Toolbar dengan fungsi formatting */}
              <div className="flex items-center gap-1 border-t dark:border-gray-700 pt-3">
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  title="Align Left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  title="Align Center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M6 18h12" />
                  </svg>
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 font-bold text-sm"
                  title="Bold"
                >
                  B
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 italic text-sm"
                  title="Italic"
                >
                  I
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 underline text-sm"
                  title="Underline"
                >
                  U
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  title="Strikethrough"
                >
                  <span className="line-through text-sm">S</span>
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  title="Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button 
                  type="button"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  title="Attach"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                {/* Character counter yang berfungsi */}
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t dark:border-gray-700">
              <button
                onClick={handleCreate}
                disabled={submitting || !content.trim()}
                className="w-full bg-[#5A4FB5] text-white py-2.5 rounded-lg font-medium hover:bg-[#4a42a5] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Creating..." : "Create Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Notes */}
      {loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          No notes yet. Start writing!
        </p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            /* Note Card Design sesuai mockup */
            <div key={note.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm group">
              {/* Header */}
              <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">
                    <FileText size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 dark:text-white">
                      {note.title || "Note by"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {note.creator?.fullName || "Unknown"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(note.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                    <Edit size={14} className="text-gray-400" />
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  >
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* Image Placeholder (jika ada attachment) */}
              {note.hasAttachment && (
                <div className="px-4 pb-4">
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}