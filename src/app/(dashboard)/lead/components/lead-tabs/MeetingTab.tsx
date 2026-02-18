"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import "react-datepicker/dist/react-datepicker.css";
import { Video, User,  Calendar, MoreHorizontal, Edit, Trash2, Clock, MapPin, ChevronUp, ChevronDown, X, Users, FileText } from "lucide-react";
import ConfirmationModal from "../ConfirmationModal";

interface MeetingTabProps {
  leadId: string;
  onRefresh?: () => void;
  showForm?: boolean;      
  setShowForm?: (val: boolean) => void;
  filterStatus?: string;
  searchQuery?: string;
}

export default function MeetingTab({ 
  leadId, 
  onRefresh,
  showForm,
  setShowForm,
  filterStatus = "ALL",
  searchQuery = ""
}: MeetingTabProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isModalOpen = showForm || false;
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [link, setLink] = useState("");
  const [outcome, setOutcome] = useState("");
  const [attendees, setAttendees] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reminder, setReminder] = useState("15");
  const [users, setUsers] = useState<any[]>([]); // Daftar semua user dari DB
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]); // Array ID user yg dipilih
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Toggle custom dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const maxChars = 100;

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}/meetings`);
      setMeetings(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Kita tambahkan ?status=ACTIVE agar karyawan non-aktif tidak masuk opsi
      const res = await apiClient.get('/users?status=ACTIVE'); 
      
      // Axios mengembalikan response di dalam .data, 
      // dan API Anda mereturn { data: users }, jadi pemanggilannya res.data.data
      setUsers(res.data.data || []); 
    } catch (e) {
      console.error("Gagal mengambil data user:", e);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchMeetings();
      fetchUsers();
    }// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees((prev) => 
      prev.includes(userId) 
        ? prev.filter((id) => id !== userId) // Jika sudah ada, hapus (uncheck)
        : [...prev, userId] // Jika belum ada, tambahkan (check)
    );
  };

  const handleClose = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setLink("");
    setOutcome("");
    setAttendees("");
    setReminder("15");
    setTimezone("Asia/Jakarta");
    setSelectedAttendees([]); // <--- PASTIKAN INI ADA
    setIsDropdownOpen(false);
    if (setShowForm) setShowForm(false);
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setTitle(m.title || "");
    setDescription(m.description || "");
    setLocation(m.location || "");
    setTimezone(m.timezone || "Asia/Jakarta");
    setLink(m.meetingLink || "");
    setOutcome(m.outcome || "");
    // Attendees di DB adalah relation, untuk saat ini kita kosongkan atau ambil dari description jika ada
    setReminder(m.reminderMinutesBefore ? String(m.reminderMinutesBefore) : "15");

    if (m.attendees && Array.isArray(m.attendees)) {
       // Kita ambil userId dari setiap item di array attendees
       // Struktur Prisma biasanya: item.userId atau item.user.id
       const ids = m.attendees.map((item: any) => item.userId || item.user?.id);
       setSelectedAttendees(ids);
    } else {
       setSelectedAttendees([]);
    }

    if (m.startTime) {
        const dStart = new Date(m.startTime);
        setSelectedDate(dStart.toISOString().split('T')[0]);
        setStartTime(dStart.toTimeString().slice(0, 5)); // HH:mm
    }
    
    if (m.endTime) {
        const dEnd = new Date(m.endTime);
        setEndTime(dEnd.toTimeString().slice(0, 5));
    }

    if (setShowForm) setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title) return alert("Meeting title is required");
    if (!selectedDate || !startTime || !endTime) return alert("Date and Time are required");

    // Validasi sederhana
    if (startTime >= endTime) {
        return alert("End time must be after Start time");
    }

    setSubmitting(true);
    try {
      // Gabungkan Date + Time
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`).toISOString();

      // Karena Schema DB Anda tidak punya kolom 'attendees' (string),
      // Kita tempelkan info attendees ke deskripsi agar tidak hilang
      const finalDescription = attendees 
        ? `[Attendees: ${attendees}]\n\n${description}`
        : description;

      const payload = {
        title: title,
        description: finalDescription,
        startTime: startDateTime,
        endTime: endDateTime,
        timezone: timezone,
        location: location,
        meetingLink: link,
        outcome: outcome,
        reminderMinutesBefore: parseInt(reminder),
        attendeeIds: selectedAttendees,
      };

      if (editingId) {
        await apiClient.patch(`/meetings/${editingId}`, payload);
        alert("Meeting updated!");
      } else {
        await apiClient.post(`/leads/${leadId}/meetings`, payload);
        alert("Meeting scheduled!");
      }

      handleClose();
      fetchMeetings();
      onRefresh?.();
    } catch (error: any) {
      console.error(error);
      alert(`Failed to save: ${error.response?.data?.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
        await apiClient.delete(`/meetings/${deleteConfirmId}`);
        fetchMeetings();
        onRefresh?.();
    } catch (err) {
        alert("Failed to delete meeting");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Format date untuk list: "Today, 12.00 PM"
  const formatMeetingDate = (isoString: string) => {
    if(!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  // Calculate duration
  const calculateDuration = (start: string, end: string) => {
    if(!start || !end) return "-";
    const s = new Date(start);
    const e = new Date(end);
    const diffMins = Math.floor((e.getTime() - s.getTime()) / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // 1. Logika Filter & Search di dalam komponen MeetingTab
const filteredMeetings = meetings.filter((m) => {
  // A. Logika Search (Judul, Deskripsi, atau Lokasi)
  const query = searchQuery.toLowerCase();
  const matchesSearch = 
    (m.title?.toLowerCase() || "").includes(query) ||
    (m.description?.toLowerCase() || "").includes(query) ||
    (m.location?.toLowerCase() || "").includes(query);

  // B. Logika Filter Status (Konteks waktu dan Link)
  const now = new Date();
  const startTime = new Date(m.startTime);
  
  let matchesFilter = true;
  if (filterStatus === "UPCOMING") {
    matchesFilter = startTime > now; // Meeting yang belum mulai
  } else if (filterStatus === "PAST") {
    matchesFilter = startTime <= now; // Meeting yang sudah lewat
  } else if (filterStatus === "HAS_LINK") {
    matchesFilter = !!m.meetingLink; // Hanya yang punya link (Online)
  }

  return matchesSearch && matchesFilter;
});

  return (
    <div>
      {/* LIST MEETINGS - SESUAI WIREFRAME */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5A4FB5] border-t-transparent" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No meetings scheduled</p>
          </div>
        ) : (
          filteredMeetings.map((m) => (
            <div 
              key={m.id} 
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm"
            >
              {/* Header - SESUAI WIREFRAME */}
              <div 
                className="px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Expand/Collapse Arrow */}
                  <button className="text-gray-400">
                    {expandedId === m.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Icon */}
                  <div className="w-8 h-8 bg-black dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Meeting by */}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Meeting by {m.organizer?.fullName || "Unknown User"}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
              {/* Date */}
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{formatMeetingDate(m.startTime)}</span>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Mencegah expand/collapse saat menu diklik
                    setOpenMenuId(openMenuId === m.id ? null : m.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 transition"
                >
                  <MoreHorizontal size={16} />
                </button>

                {/* Dropdown Content */}
                {openMenuId === m.id && (
                  <>
                    {/* Overlay Transparan (Klik luar untuk tutup) */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }} 
                    />

                    {/* Menu Box */}
                    <div className="absolute right-0 top-8 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          handleEdit(m); // Panggil fungsi Edit
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          handleDeleteClick(m.id);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
              </div>

              {/* Expandable Content - SESUAI WIREFRAME */}
              {expandedId === m.id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Organized by */}
                  <div className="py-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Organized by</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                        {/* Menggunakan data organizer dari list meeting, bukan currentUser */}
                        {m.organizer?.photo ? (
                          <img 
                            src={m.organizer.photo} 
                            alt={m.organizer.fullName || "Avatar"} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                        )}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {m.organizer?.email || "email@notfound.com"}
                      </span>
                    </div>
                  </div>

                  {/* Attendee description */}
                  <div className="py-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Attendee description</p>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {m.description || "Hey guys, ...."}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Outcome, Attendes, Duration - 3 KOLOM SESUAI WIREFRAME */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Outcome */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outcome</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {m.outcome || "-"}
                      </p>
                    </div>
                    
                    {/* Attendes */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendes</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {m.attendees?.length || 0} Attends
                      </p>
                    </div>
                    
                    {/* Duration */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {calculateDuration(m.startTime, m.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL ADD MEETING - SESUAI WIREFRAME */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto no-scrollbar">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Meeting
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-0 space-y-1">
              
              {/* Meeting Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter Meeting..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>

              {/* Description dengan toolbar dan counter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, maxChars))}
                    placeholder="Describe your event..."
                    rows={2}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {description.length}/{maxChars}
                  </span>
                </div>
              </div>

              {/* Time and date section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Time and date
                </h4>

                {/* Row 1: Date & Attendees - 2 KOLOM */}
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]" 
                      />
                    </div>
                  </div>
                  {/* ATTENDEES MULTI-SELECT CUSTOM */}
                  <div className="relative"> 
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Attendees
                    </label>
                    
                    {/* Tombol Pembuka Dropdown */}
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center min-h-[38px] focus:ring-2 focus:ring-[#5A4FB5] transition-all"
                    >
                        <span className="truncate text-gray-700 pr-2">
                          {selectedAttendees.length > 0 
                              ? `${selectedAttendees.length} User(s) selected` 
                              : "Select attendees..."}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Isi Dropdown (Checkbox List) */}
                    {isDropdownOpen && (
                        <>
                          {/* Overlay Transparan (Klik luar untuk tutup) */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsDropdownOpen(false)}
                          ></div>

                          {/* Kotak Menu Dropdown */}
                          <div className="absolute z-50 mt-1 w-full left-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto custom-scrollbar">
                            {users.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500 text-center italic">No users found</div>
                            ) : (
                                <div className="p-1">
                                  {users.map((u) => (
                                    <div 
                                        key={u.id}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Mencegah event bocor
                                            toggleAttendee(u.id);
                                        }}
                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <input 
                                          type="checkbox" 
                                          checked={selectedAttendees.includes(u.id)}
                                          readOnly
                                          className="w-4 h-4 text-[#5A4FB5] rounded border-gray-300 focus:ring-[#5A4FB5] shrink-0 pointer-events-none"
                                        />
                                        <div className="flex flex-col overflow-hidden">
                                          <span className="text-sm font-semibold text-gray-800 truncate">
                                              {u.fullName || "User"}
                                          </span>
                                          <span className="text-xs text-gray-500 truncate">
                                              {u.email}
                                          </span>
                                        </div>
                                    </div>
                                  ))}
                                </div>
                            )}
                          </div>
                        </>
                    )}
                  </div>
                </div>
                {/* Row 2: Start time, End time, Time zone - 3 KOLOM */}
                <div className="grid grid-cols-3 gap-3 mb-1">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start time</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End time</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time zone</label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full appearance-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                        <option value="UTC">UTC</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 3: Location, Link Meeting, Reminder - 3 KOLOM */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Type address or select..."
                        className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] bg-white text-gray-700 placeholder:text-gray-400"
                        // Saat input diklik/fokus, kita bisa opsional membuka dropdown juga (opsional)
                        // onFocus={() => setShowLocationDropdown(true)} 
                      />

                      {/* 2. TOMBOL TRIGGER DROPDOWN (Chevron) */}
                      <button
                        type="button" // Penting: type button agar tidak submit form
                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                        className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-[#5A4FB5] transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 3. DROPDOWN MENU (Opsi Standar) */}
                      {showLocationDropdown && (
                        <>
                          {/* Invisible Overlay (Klik luar untuk tutup) */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowLocationDropdown(false)}
                          ></div>

                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {/* Opsi-opsi Standar */}
                            {["Online", "Office", "Client Site"].map((option) => (
                              <div
                                key={option}
                                onClick={() => {
                                  setLocation(option); // Set nilai ke input
                                  setShowLocationDropdown(false); // Tutup dropdown
                                }}
                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#5A4FB5] cursor-pointer transition-colors flex items-center gap-2"
                              >
                                {/* Ikon kecil sebagai pemanis (Opsional) */}
                                <MapPin size={14} className="opacity-50" />
                                {option}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Link Meeting</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Input Link Meeting..."
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reminder</label>
                    <div className="relative">
                      <select value={reminder} onChange={(e) => setReminder(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                        <option value="5">5 minutes before</option>
                        <option value="10">10 minutes before</option>
                        <option value="15">15 minutes before</option>
                        <option value="30">30 minutes before</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Outcome
                </label>
                <textarea
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Describe the meeting outcome..."
                  rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] resize-none"
                />
              </div>
            </div>

            {/* Footer - Button hitam center */}
            <div className="flex justify-center px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#5A4FB5] text-white px-6 py-1 rounded-lg font-medium hover:bg-[#483d96] transition"
              >
                {submitting ? "Saving..." : (editingId ? "Update Meeting" : "Create Meeting")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteConfirmId}
        type="delete"
        title="Delete Meeting?"
        desc="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}