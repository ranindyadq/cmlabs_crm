"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Paperclip, File as FileIcon, Mail, Calendar, Edit, Trash2, X, ChevronDown, ImageIcon, User, ArrowLeft } from "lucide-react";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css";
import ConfirmationModal from "../ConfirmationModal";

interface CurrentUser {
  email: string;
  fullName: string;
  photo?: string | null;
}

interface EmailTabProps {
  leadId: string;
  leadEmail?: string;
  onRefresh?: () => void;
  showForm?: boolean;
  setShowForm?: (val: boolean) => void;
  replyToSubject?: string;
  filterType?: string;
  searchQuery?: string;
}

export default function EmailTab({ 
  leadId, 
  leadEmail,
  replyToSubject,
  onRefresh,
  showForm,
  setShowForm,
  filterType = "ALL",
  searchQuery = ""
}: EmailTabProps) {

  const [emails, setEmails] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State - SESUAI WIREFRAME
  const [toAddress, setToAddress] = useState("");
  const [inputTo, setInputTo] = useState("");
  const [ccAddress, setCcAddress] = useState("");
  const [bccAddress, setBccAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bccList, setBccList] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Schedule dropdown
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [isCustomSchedule, setIsCustomSchedule] = useState(false); // Mode custom
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const isModalOpen = showForm || false;

  // Helper: Hitung Waktu Preset (Pagi/Siang/Sore)
  const getScheduledTime = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    if (date < new Date()) {
      date.setDate(date.getDate() + 1); // Besok jika jam sudah lewat
    }
    return date;
  };

  const formatScheduleLabel = (date: Date) => {
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + 
           ", " + 
           date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // === LOGIKA AUTO-FILL ===
  useEffect(() => {
    // Setiap kali form dibuka (showForm true)
    if (showForm && !editingId) {
      if (replyToSubject) {
                // Jika mode reply, tambahkan prefix "Re: "
                setSubject(`Re: ${replyToSubject}`); 
            } else {
                setSubject(""); // Jika baru, kosongkan
            }
       // Jika ada email lead dari props, jadikan Chip otomatis
       if (leadEmail) {
         setToAddress(leadEmail);
       } else {
         // Jika tidak ada, kosongkan agar user mengetik
         setToAddress("");
       }
       setInputTo(""); // Pastikan input manual bersih
    }
  }, [showForm, leadEmail, replyToSubject, editingId]);

  const handleBccKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Jika user tekan Enter, Tab, atau Koma
    if (["Enter", "Tab", ","].includes(e.key)) {
      e.preventDefault();
      
      const value = bccInput.trim();
      
      // Validasi: Tidak boleh kosong & Format email harus benar
      if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          // Cek duplikasi agar tidak ada email kembar di Bcc
          if (!bccList.includes(value)) {
              setBccList([...bccList, value]);
          }
          setBccInput(""); // Reset input setelah jadi chip
      }
    }
  };

  // Fungsi hapus chip Bcc
  const removeBcc = (emailToRemove: string) => {
      setBccList(bccList.filter(email => email !== emailToRemove));
  };

  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", "Tab", ","].includes(e.key)) {
      e.preventDefault();
      
      const value = ccInput.trim();
      
      // Validasi: Tidak boleh kosong & Format email sederhana
      if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          // Cek duplikasi agar tidak ada email kembar
          if (!ccList.includes(value)) {
              setCcList([...ccList, value]);
          }
          setCcInput(""); // Reset input
      }
    }
  };

  const removeCc = (emailToRemove: string) => {
      setCcList(ccList.filter(email => email !== emailToRemove));
  };
  
  // Saat user menekan Enter, Tab, atau Koma -> Jadikan Chip
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", "Tab", ","].includes(e.key)) {
      e.preventDefault();
      if (inputTo.trim()) {
        setToAddress(inputTo.trim()); // Set sebagai Chip
        setInputTo(""); // Kosongkan input
      }
    }
  };

  // Saat user klik di luar input (Blur) -> Auto save jika ada teks
  const handleInputBlur = () => {
    if (inputTo.trim()) {
        setToAddress(inputTo.trim());
        setInputTo("");
    }
  };

  // Hapus Chip
  const removeToAddress = () => {
    setToAddress("");
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      
      // GANTI URL INI: Dari query param menjadi sub-route
      // LAMA: const res = await apiClient.get(`/leads/${leadId}?activity_type=EMAIL`);
      
      // BARU: Panggil endpoint khusus yang baru kita buat
      const res = await apiClient.get(`/leads/${leadId}/emails`);
      
      // Pastikan ambil path data yang benar (sesuai return API: res.data.data)
      setEmails(res.data.data || []);
      
    } catch (err) { 
      console.error("Gagal ambil email:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchCurrentUser = async () => {
    try {
      // Kita panggil endpoint yang sama dengan Profile Page
      const res = await fetch("/api/profile"); 
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.data); // Simpan data user
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  useEffect(() => { 
    if (leadId) fetchEmails();
    fetchCurrentUser(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  // === HANDLE EDIT (BARU) ===
  const handleEdit = (email: any) => {
    setEditingId(email.id); // Set ID yang sedang diedit
    
    // Populate Form Data
    setToAddress(email.toAddress);
    setSubject(email.subject || "");
    setBody(email.body || "");
    
    // Parse CC & BCC string kembali ke Array
    setCcList(email.ccAddress ? email.ccAddress.split(", ") : []);
    setBccList(email.bccAddress ? email.bccAddress.split(", ") : []);
    
    // Set Schedule jika ada
    if (email.scheduledAt) {
        setSelectedDate(new Date(email.scheduledAt));
        setIsCustomSchedule(true); // Agar UI datepicker muncul jika diperlukan
    } else {
        setSelectedDate(new Date());
    }

    // Set Attachment URL (jika ada file lama)
    setAttachmentUrl(email.attachmentUrl);
    setAttachment(null); // Reset file upload baru

    // Buka Modal
    if (setShowForm) setShowForm(true);
  };

  const handleClose = () => {
    setEditingId(null);
    setToAddress("");
    setCcAddress("");
    setBccAddress("");
    setSubject("");
    setBody("");
    setShowSendDropdown(false);
    setIsCustomSchedule(false);
    setAttachment(null); // Reset attachment
    setAttachmentUrl(null);
    setIsUploading(false);
    if (setShowForm) setShowForm(false);
  };

  // Handler saat user memilih file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  // Handler hapus file terpilih
  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentUrl(null);
  };

  const handleSend = async (scheduledDate?: Date) => {
    let uploadedUrl = attachmentUrl || "";

        // 1. Upload File (Jika ada file BARU)
    if (attachment) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", attachment);

        try {
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                uploadedUrl = data.url; 
            } else {
                 console.warn("Upload gagal, pakai mock");
                 uploadedUrl = "https://placehold.co/600x400?text=Updated+Attachment"; 
            }
        } catch (e) { console.error(e); }
        setIsUploading(false);
    }

    if (!toAddress || !subject) {
      alert("To and Subject are required");
      return;
    }

    if (!subject.trim()) {
        alert("Subject cannot be empty");
        return; // Stop proses jika kosong
    }

    // Cek apakah user lupa tekan enter (masih ada teks di input)
    const finalTo = toAddress || inputTo; 

    if (!finalTo || !subject) {
      alert("To and Subject are required");
      return;
    }

    const finalCcList = [...ccList];
    if (ccInput.trim()) {
        finalCcList.push(ccInput.trim());
    }
    const ccString = finalCcList.join(", ");

    const finalBccList = [...bccList];
    // Jaga-jaga user lupa enter input terakhir
    if (bccInput.trim()) {
        finalBccList.push(bccInput.trim());
    }
    const bccString = finalBccList.join(", ");

    setSubmitting(true);
    try {
      const finalScheduledAt = scheduledDate || null;
      const payload = {
        subject,
        body,
        toAddress: finalTo,
        fromAddress: currentUser?.email || "", 
        ccAddress: finalCcList.join(", "),
        bccAddress: finalBccList.join(", "),
        scheduledAt: finalScheduledAt ? finalScheduledAt.toISOString() : null, 
        attachmentUrl: uploadedUrl || null
      };

      await apiClient.post(`/leads/${leadId}/emails`, {
        subject: subject,
        body,
        toAddress: finalTo, // Gunakan finalTo
        fromAddress: currentUser?.email || "", 
        ccAddress: ccString,
        bccAddress: bccString,
        scheduledAt: finalScheduledAt ? finalScheduledAt.toISOString() : null,
        attachmentUrl: uploadedUrl || null,
      });

      if (editingId) {
          // === UPDATE MODE (PATCH) ===
          // Asumsi endpoint update: /api/emails/:id
          // Jika belum ada, Anda perlu membuatnya atau gunakan endpoint leads dengan method PUT
          await apiClient.patch(`/emails/${editingId}`, payload);
          alert("Email updated successfully!");
      } else {
          // === CREATE MODE (POST) ===
          await apiClient.post(`/leads/${leadId}/emails`, payload);
          if (finalScheduledAt) alert(`Email scheduled!`);
          else alert("Email sent!");
      }

      handleClose();
      fetchEmails();
      onRefresh?.();
    } catch (err) { 
      alert("Failed to send email"); 
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (emailId: string) => {
    setDeleteConfirmId(emailId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiClient.delete(`/emails/${deleteConfirmId}`);
      fetchEmails();
      onRefresh?.();
    } catch (err) {
      alert("Failed to delete email");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Format date: "July 25, 2025"
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  // 1. Logika Filter & Search di dalam komponen EmailTab
const filteredEmails = emails.filter((email) => {
  // A. Logika Search (Subjek, Body, atau Alamat Penerima)
  const query = searchQuery.toLowerCase();
  const matchesSearch = 
    (email.subject?.toLowerCase() || "").includes(query) ||
    (email.body?.toLowerCase() || "").includes(query) ||
    (email.toAddress?.toLowerCase() || "").includes(query);

  // B. Logika Filter Kategori
  let matchesFilter = true;
  if (filterType === "SENT") {
    // Email yang sudah terkirim (tidak memiliki jadwal atau jadwal sudah lewat)
    matchesFilter = !email.scheduledAt || new Date(email.scheduledAt) <= new Date();
  } else if (filterType === "SCHEDULED") {
    // Email yang masih dijadwalkan (jadwal di masa depan)
    matchesFilter = !!email.scheduledAt && new Date(email.scheduledAt) > new Date();
  } else if (filterType === "HAS_ATTACHMENT") {
    // Hanya email dengan lampiran
    matchesFilter = !!email.attachmentUrl;
  }

  return matchesSearch && matchesFilter;
});

  return (
    <div>
      {/* LIST EMAILS - SESUAI WIREFRAME */}
      <div className="space-y-4">
  {loading ? (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A4FB5] border-t-transparent" />
    </div>
  ) : filteredEmails.length === 0 ? (
    <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
      <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-400 dark:text-gray-500">No emails logged</p>
    </div>
  ) : (
    filteredEmails.map((email) => (
      <div 
        key={email.id} 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
      >
        {/* Header - Satu Baris Horizontal */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {/* Left: Icon + Subject */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {email.subject || "(No Subject)"}
            </span>
          </div>
          
          {/* Right: Date + Actions */}
          <div className="flex items-center gap-3 ml-4">
            {/* Date */}
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">
                {new Date(email.sentAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleEdit(email)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-400 hover:text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteClick(email.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 py-4">
          {/* Email Address */}
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {email.toAddress}
          </p>
          
          {/* CC if exists */}
          {email.ccAddress && (
            <p className="text-xs text-gray-500 mb-2">Cc: {email.ccAddress}</p>
          )}
          
          {/* Body Preview */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {email.body ? (
              email.body.length > 150 
                ? `${email.body.substring(0, 150)}...` 
                : email.body
            ) : (
              <span className="italic text-gray-400">(No content)</span>
            )}
          </p>

          {/* Attachment Area - Besar dan Prominent */}
          {email.attachmentUrl && (
            <div className="mt-3">
              {email.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                // Image Preview
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img 
                    src={email.attachmentUrl} 
                    alt="Attachment" 
                    className="w-full h-auto max-h-72 object-contain bg-gray-50/50"
                  />
                </div>
              ) : (
                // Non-image Attachment (PDF, docs, etc)
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <a 
                      href={email.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Attachment
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div> 
    )) 
  )}
</div>

    {/* MODAL ADD NEW EMAIL - SESUAI WIREFRAME */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Activity E-mail" : "Add New Activity E-mail"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-0 space-y-2">
              
              {/* From - Avatar + Email */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser?.photo ? (
                     <img 
                       src={currentUser.photo} 
                       alt="Avatar" 
                       className="w-full h-full object-cover" 
                     />
                  ) : (
                     <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email || "..."}
                  </span>
              </div>

              {/* To */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 dark:text-gray-400 w-8">To:</label>
                <div className="flex-1 flex items-center gap-2">
                  {toAddress ? (
                    <div className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-medium">
                      <span>{toAddress}</span>
                      <button 
                        onClick={removeToAddress}
                        className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                  /* TAMPILAN 2: INPUT (Jika belum ada email) */
                    <input
                      type="email"
                      value={inputTo}
                      onChange={(e) => setInputTo(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      onBlur={handleInputBlur}
                      placeholder=""
                      className="flex-1 border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0 p-0 placeholder:text-gray-400"
                      autoFocus // Opsional: langsung fokus saat chip dihapus
                    />
                  )}
                </div>
              </div>
              
              {/* Cc */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 dark:text-gray-400 w-8">Cc:</label>
                <div className="flex-1 flex flex-wrap gap-2 items-center border-b border-transparent focus-within:border-gray-200 transition-colors">
                  {/* Render Chips (Email yang sudah di-enter) */}
                  {ccList.map((email, idx) => (
                    <div key={idx} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs">
                      <span>{email}</span>
                      <button 
                        onClick={() => removeCc(email)}
                        className="hover:text-red-500 text-gray-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Input Field */}
                  <input
                    type="email"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    placeholder={ccList.length === 0 ? "" : ""}
                    className="flex-1 min-w-[120px] border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0 p-1"
                  />
                </div>
              </div>

              {/* Bcc */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500 dark:text-gray-400 w-8">Bcc:</label>
                  <div className="flex-1 flex flex-wrap gap-2 items-center border-b border-transparent focus-within:border-gray-200 transition-colors">
                  {/* 1. Render Chips (Email yang sudah di-enter) */}
                  {bccList.map((email, idx) => (
                    <div key={idx} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs">
                      <span>{email}</span>
                      <button 
                        onClick={() => removeBcc(email)}
                        className="hover:text-red-500 text-gray-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {/* 2. Input Field untuk mengetik */}
                  <input
                    type="email"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={handleBccKeyDown}
                    placeholder={bccList.length === 0 ? "" : ""}
                    className="flex-1 min-w-[120px] border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0 p-1"
                  />
                </div>
              </div>

              {/* Subjek */}
              <div className="flex items-center gap-3 border-t dark:border-gray-700 pt-3">
                <label className="text-sm text-gray-500 dark:text-gray-400">Subjek :</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
                />
              </div>

              {/* Body */}
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-gray-400 transition-all bg-white dark:bg-gray-800">
                {/* Area Ketik */}
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here......"
                  rows={3}
                  className="w-full p-4 border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none resize-none placeholder:text-gray-300 leading-relaxed"
                />
              </div>
              {/* Attachment */}
              <div>
                  <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={handleFileChange}
                  />
                  <label 
                      htmlFor="file-upload" 
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 cursor-pointer flex items-center justify-center transition"
                      title="Attach file"
                  >
                      <Paperclip size={16}/>
                  </label>
              </div>
          </div>

          {/* PREVIEW FILE TERPILIH (Muncul di bawah toolbar jika ada file) */}
          {(attachment || attachmentUrl) && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1.5 bg-white border border-gray-200 rounded">
                          <FileIcon size={14} className="text-blue-500"/>
                      </div>
                      <span className="text-xs text-gray-700 truncate max-w-[200px]">
                          {attachment ? attachment.name : "Existing Attachment"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                          ({attachment ? (attachment.size / 1024).toFixed(0) : "0"} KB)
                      </span>
                  </div>
                  <button 
                      onClick={removeAttachment}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                  >
                      <X size={14} />
                  </button>
              </div>
          )}

            {/* === FOOTER WITH SCHEDULE LOGIC === */}
            <div className="px-6 py-4 flex justify-end">
              <div className="relative">
                <div className="flex shadow-sm rounded-lg">
                  <button
                    onClick={() => handleSend()} // Kirim Sekarang (tanpa parameter)
                    disabled={submitting}
                    className="bg-[#5A4FB5] dark:bg-white text-white dark:text-black px-6 py-1 rounded-l-lg font-medium hover:opacity-90 disabled:opacity-50 transition border-r border-gray-600 dark:border-gray-300"
                  >
                    {submitting ? "Sending..." : "Send"}
                  </button>
                  <button
                    onClick={() => setShowSendDropdown(!showSendDropdown)}
                    disabled={submitting}
                    className="bg-[#5A4FB5] dark:bg-white text-white dark:text-black px-3 py-1 rounded-r-lg hover:opacity-90 transition"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* === DROPDOWN MENU === */}
                {showSendDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 overflow-hidden z-50">
                    
                    {/* MODE 1: PILIH PRESET (Default) */}
                    {!isCustomSchedule ? (
                      <>
                        <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Jadwalkan Pengiriman</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Waktu Indonesia Barat</p>
                        </div>
                        
                        <div className="py-1">
                          {/* Preset Pagi */}
                          <button 
                            onClick={() => handleSend(getScheduledTime(8))}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center group"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Pagi ini</span>
                            <span className="text-xs text-gray-400">{formatScheduleLabel(getScheduledTime(8))}</span>
                          </button>
                          
                          {/* Preset Siang */}
                          <button 
                            onClick={() => handleSend(getScheduledTime(13))}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center group"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Siang ini</span>
                            <span className="text-xs text-gray-400">{formatScheduleLabel(getScheduledTime(13))}</span>
                          </button>

                          {/* Preset Sore */}
                          <button 
                             onClick={() => handleSend(getScheduledTime(17))}
                             className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center group"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white">Sore ini</span>
                            <span className="text-xs text-gray-400">{formatScheduleLabel(getScheduledTime(17))}</span>
                          </button>
                        </div>

                        {/* Tombol ke Mode Custom */}
                        <div className="border-t dark:border-gray-700">
                          <button 
                            onClick={() => setIsCustomSchedule(true)} // Switch ke Mode 2
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium"
                          >
                            <Calendar className="w-4 h-4" />
                            Custom Date & Time
                          </button>
                        </div>
                      </>
                    ) : (
                      
                      /* MODE 2: DATE PICKER CUSTOM */
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <button 
                            onClick={() => setIsCustomSchedule(false)} // Kembali ke Preset
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                          </button>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Pilih Waktu</span>
                        </div>

                        {/* React DatePicker Component */}
                        <div className="mb-4">
                            <label className="block text-xs text-gray-500 mb-1">Tanggal & Jam</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="d MMMM yyyy, HH:mm"
                                minDate={new Date()} // Tidak boleh tanggal lampau
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                wrapperClassName="w-full"
                            />
                        </div>

                        {/* Tombol Eksekusi Jadwal */}
                        <button
                            onClick={() => selectedDate && handleSend(selectedDate)}
                            disabled={!selectedDate}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Schedule Send
                        </button>
                      </div>
                       )}
                    </div>
                  )}
              </div>
            </div>
            </div>
          </div>
      )}

      <ConfirmationModal
        open={!!deleteConfirmId}
        type="delete"
        title="Delete Email?"
        desc="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}