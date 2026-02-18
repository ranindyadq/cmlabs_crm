"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Trash2, Calendar, FileText, Edit, ImageIcon, X, ChevronDown, Paperclip, FileIcon } from "lucide-react";
import ConfirmationModal from "../ConfirmationModal";

export default function NotesTab({ 
  leadId, 
  onRefresh,
  showForm,
  setShowForm,
  filterType = "ALL",
  searchQuery = ""
}: { 
  leadId: string; 
  onRefresh?: () => void;
  showForm: boolean;
  setShowForm: (val: boolean) => void;
  filterType?: string;
  searchQuery?: string;
}) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  
  // Character counter - sesuai wireframe 0/100
  const maxChars = 100;

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}/notes`); // Pastikan path-nya benar
      setNotes(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      // Jika ingin preview gambar langsung:
      if (file.type.startsWith("image/")) {
        setAttachmentUrl(URL.createObjectURL(file));
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentUrl(null);
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setAttachmentUrl(note.attachmentUrl || null);
    // Pastikan format tanggal sesuai untuk input type="date" (YYYY-MM-DD)
    setSelectedDate(new Date(note.createdAt).toISOString().split('T')[0]);
    setShowForm(true); // Buka modal
  };

  useEffect(() => {
    if (leadId) fetchNotes();
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [leadId, filterType, searchQuery]);

  const handleClose = () => {
    
    setContent("");
    setTitle("");
    // Reset ke tanggal hari ini agar saat buka Note Baru tidak kosong
    setSelectedDate(new Date().toISOString().split('T')[0]);
    // PENTING: Reset ID editing agar kembali ke mode "Create" (bukan "Update")
    setEditingNoteId(null); 
    setAttachment(null);
    if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
    setAttachmentUrl(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return alert("Description is required");
    
    setSubmitting(true);
    try {
      let finalUrl = attachmentUrl;  
      
      // 1. Jika ada file baru dipilih, upload dulu ke API Route yang baru Anda buat
    if (attachment) {
      const formData = new FormData();
      formData.append("file", attachment);

      const uploadRes = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      finalUrl = uploadRes.data.url; // Dapatkan URL: /uploads/12345_file.jpg
    }

        const payload = {
        content,
        title: title.trim(),
        createdAt: selectedDate,
        attachmentUrl: finalUrl
      };

      if (editingNoteId) {
        await apiClient.patch(`/notes/${editingNoteId}`, payload);
      } else {
        await apiClient.post(`/leads/${leadId}/notes`, payload);
      }
      
      handleClose(); // Reset state & tutup modal
      fetchNotes();
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (noteId: string) => {
    setDeleteConfirmId(noteId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiClient.delete(`/notes/${deleteConfirmId}`);
      fetchNotes();
      onRefresh?.();
    } catch (err) {
      alert("Failed to delete note");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Format date sesuai wireframe "July 25, 2025"
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredNotes = notes.filter((note) => {
  // A. Logika Search (Judul atau Konten)
  const query = searchQuery.toLowerCase();
  const matchesSearch = 
    (note.title?.toLowerCase() || "").includes(query) ||
    (note.content?.toLowerCase() || "").includes(query);

  // B. Logika Filter Kategori
  let matchesFilter = true;
  if (filterType === "ATTACHMENT") {
    matchesFilter = !!note.attachmentUrl; // Hanya yang punya lampiran
  } else if (filterType === "TEXT_ONLY") {
    matchesFilter = !note.attachmentUrl; // Hanya yang tidak punya lampiran
  }

  return matchesSearch && matchesFilter;
});

  return (
    <div className="space-y-4">
      {/* Modal Add Note - SESUAI WIREFRAME */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Note
              </h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="px-6 py-0 space-y-1">
              {/* Date Created - Dropdown style sesuai wireframe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Date Created
                </label>
                <div className="relative">
                {/* Ikon Kalender tetap di kiri sebagai pemanis */}
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent appearance-none
                  [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />  
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter note title"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
                />
              </div>

              {/* Description - dengan counter di kanan bawah textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                    placeholder="Enter your note here"
                    rows={4}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent resize-none"
                  />
                  {/* Counter di kanan bawah - SESUAI WIREFRAME */}
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {content.length}/{maxChars}
                  </span>
                </div>
              </div>

            <div className="flex items-center gap-2">
                <input type="file" id="note-file" className="hidden" onChange={handleFileChange} />
                <label 
                  htmlFor="note-file" 
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 cursor-pointer transition"
                >
                  <Paperclip size={14} />
                  <span>Attach File</span>
                </label>
              </div>

              {/* Preview Attachment */}
              {(attachment || attachmentUrl) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded">
                      <FileIcon size={16} className="text-[#5A4FB5]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate max-w-[200px]">
                        {attachment ? attachment.name : "Existing Attachment"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {attachment ? `${(attachment.size / 1024).toFixed(0)} KB` : "Stored File"}
                      </span>
                    </div>
                  </div>
                  <button onClick={removeAttachment} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer - Button hitam sesuai wireframe */}
            <div className="flex justify-center px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="bg-[#5A4FB5] text-white px-6 py-1 rounded-lg font-medium hover:bg-[#483d96] transition"
              >
                {editingNoteId ? "Edit Note" : "Add New Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Notes - SESUAI WIREFRAME */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A4FB5] border-t-transparent" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm group"
            >
              {/* Note Header - SESUAI WIREFRAME */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  {/* "Note by" text */}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Note by {note.user?.fullName || "System"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Date - Format "July 25, 2025" sesuai wireframe */}
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{formatDate(note.createdAt)}</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(note)} // Panggil fungsi handleEdit
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(note.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Content - SESUAI WIREFRAME */}
              <div className="px-4 pb-4">
                {/* Title - "This is note title" */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {note.title || "Untitled Note"}
                </h3>
                
                {/* Content/Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {note.content}
                </p>
              </div>

              {note.attachmentUrl && (
                <div className="mt-3">
                  {note.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <img src={note.attachmentUrl} alt="Attachment" className="w-full h-auto max-h-72 object-contain bg-gray-50/50" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg w-fit bg-gray-50">
                      <FileIcon size={14} className="text-[#5A4FB5]" />
                      <a href={note.attachmentUrl} target="_blank" className="text-xs text-[#5A4FB5] hover:underline font-medium">
                        View Attachment
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        open={!!deleteConfirmId}
        type="delete"
        title="Delete Note?"
        desc="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}