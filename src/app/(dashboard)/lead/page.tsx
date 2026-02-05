"use client";

import { useState, useRef, useEffect } from "react";
import {
  Filter,
  Archive,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bot,
  X,
  Calendar
} from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import LeadColumn from "./components/LeadColumn";
import AddLeadModal from "./components/AddLeadModal";
import ConfirmationModal from "./components/ConfirmationModal";
// --- IMPOR HOOK DAN API CLIENT ---
import useLeads, { LeadFilters, FIXED_STAGES } from "@/hooks/useLeads";
import apiClient from "@/lib/apiClient";
import LeadListView from "./components/LeadListView";
import { useSearchParams } from "next/navigation";

export default function LeadsPage() {
  const { leads: serverLeads, stages, totalValues, isLoading, error,  refresh } = useLeads();
  const searchParams = useSearchParams();

// 1. STATE LOKAL (Optimistic UI)
  const [localLeads, setLocalLeads] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // 2. STATE FILTER & DATA MASTER
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // State untuk menyimpan data dari API (Pengganti Mock Data)
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [labelsList, setLabelsList] = useState<any[]>([]);

  // Filter yang Sedang Aktif
  const [appliedFilters, setAppliedFilters] = useState<LeadFilters& { status?: string }>({
    search: "", picId: "", source: "", labelId: "", startDate: "", endDate: "", status: ""
  });
  
  // Filter Sementara
  const [tempFilters, setTempFilters] = useState<LeadFilters & { status?: string; period?: string }>({
    search: "", picId: "", source: "", labelId: "", startDate: "", endDate: "", period: "", status: ""
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Panggil API profile untuk dapatkan role
        const response = await apiClient.get("/profile"); 
        const role = response.data.data.role; // Sesuaikan dengan struktur respons API Anda
        setCurrentUserRole(role);
      } catch (error) {
        console.error("Gagal ambil profil user", error);
      }
    };
    fetchUserProfile();
  }, []);

  // --- 3. FETCH DATA MASTER (Team & Labels) ---
  useEffect(() => {
    const fetchMasterData = async () => {
        try {
            // Kita pisahkan Request-nya
            
            // 1. Request Labels (Semua orang boleh akses)
            const labelsPromise = apiClient.get('/labels');

            // 2. Request Team (Sales dilarang akses /api/team)
            // Kita tambahkan .catch() khusus di sini agar kalau 403, dia return array kosong
            const teamPromise = apiClient.get('/team').catch(err => {
                // Jika error 403 (Forbidden), kembalikan data kosong yang aman
                if (err.response?.status === 403) {
                    console.warn("User tidak punya akses list Team (Aman, filter PIC disembunyikan).");
                    return { data: { data: [] } }; 
                }
                // Jika error lain (misal server mati), lempar errornya
                throw err;
            });

            // Jalankan paralel
            const [teamRes, labelsRes] = await Promise.all([
                teamPromise, 
                labelsPromise
            ]);

            setTeamMembers(teamRes.data?.data || []); // Kalau sales, ini jadi []
            setLabelsList(labelsRes.data?.data || []);
        } catch (err) {
            console.error("Gagal memuat data filter:", err);
        }
    };
    fetchMasterData();
  }, []);

  // 4. SYNC DATA LEADS
  useEffect(() => {
    if (serverLeads) setLocalLeads(serverLeads);
  }, [serverLeads]);

  // Sync Search URL
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    setAppliedFilters(prev => {
        const newFilters = { ...prev, search: searchQuery };
        refresh(newFilters);
        return newFilters;
    });
  }, [searchParams, refresh]);

  // Handle Klik Outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  const handleTempFilterChange = (key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // Logic Quick Period
  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let startStr = "", endStr = "";

    if (period === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    } else if (period === 'daily') {
        // Today
    } else if (period === 'all') {
        startStr = ""; endStr = "";
    } else if (period === 'custom') {
        setTempFilters(prev => ({ ...prev, period: 'custom' }));
        return;
    }

    if (period !== 'all' && period !== 'custom') {
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
    }

    setTempFilters(prev => ({ 
        ...prev, 
        period: period, 
        startDate: startStr, 
        endDate: endStr 
    }));
  };

  const handleApplyFilter = () => {
    const filtersToApply = {
        ...appliedFilters,
        picId: tempFilters.picId,
        source: tempFilters.source,
        labelId: tempFilters.labelId,
        startDate: tempFilters.startDate,
        endDate: tempFilters.endDate,
        status: tempFilters.status,
        // search status dihandle backend via search query atau field status khusus jika ada
    };
    setAppliedFilters(filtersToApply);
    refresh(filtersToApply);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    const empty = { 
        search: appliedFilters.search, 
        picId: "", 
        source: "", 
        labelId: "", 
        startDate: "", 
        endDate: "", 
        period: "", 
        status: "" 
    };
    setTempFilters(empty);
    setAppliedFilters(empty);
    refresh(empty);
    setIsFilterOpen(false);
  };

  // State Modal & Target ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetLeadId, setTargetLeadId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "won" | "lost" | "delete" | null;
  }>({ open: false, type: null });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

// --- LOGIKA UTAMA DRAG & DROP ---
  // --- LOGIKA DRAG & DROP ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // A. Handle Drop ke Zona Bawah (Delete/Won/Lost)
    if (["won-zone", "lost-zone", "delete-zone"].includes(destination.droppableId)) {
      setTargetLeadId(draggableId);
      if (destination.droppableId === "won-zone") setConfirmModal({ open: true, type: "won" });
      else if (destination.droppableId === "lost-zone") setConfirmModal({ open: true, type: "lost" });
      else if (destination.droppableId === "delete-zone") setConfirmModal({ open: true, type: "delete" });
      return;
    }

    // B. Handle Pindah Kolom (Kanban)
    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    // Copy state lama
    const newLeadsData = JSON.parse(JSON.stringify(localLeads)); // Deep copy aman

    // 1. Ambil dari kolom asal
    const sourceColumn = newLeadsData[sourceStageId] || [];
    const [movedLead] = sourceColumn.splice(source.index, 1);

    // 2. Masukkan ke tujuan
    if (sourceStageId === destStageId) {
      // Pindah urutan di kolom yang SAMA
      sourceColumn.splice(destination.index, 0, movedLead);
      newLeadsData[sourceStageId] = sourceColumn;
    } else {
      // Pindah ke kolom BEDA
      movedLead.stage = destStageId; // Update data stage
      const destColumn = newLeadsData[destStageId] || [];
      destColumn.splice(destination.index, 0, movedLead);
      
      newLeadsData[sourceStageId] = sourceColumn;
      newLeadsData[destStageId] = destColumn;
    }

    // 3. Update UI Duluan (Optimistic)
    setLocalLeads(newLeadsData);

    // 4. Update Backend (Background)
    if (sourceStageId !== destStageId) {
      try {
        await apiClient.patch(`/leads/${draggableId}`, { stage: destStageId });
      } catch (err) {
        console.error("Gagal update stage:", err);
        setLocalLeads(serverLeads); // Rollback jika gagal
        alert("Gagal memindahkan kartu.");
      }
    }
  };

  // --- LOGIKA AKSI MODAL (DELETE / WON / LOST) ---
  const handleConfirmAction = async () => {
    if (!targetLeadId || !confirmModal.type) return;

    // 1. Copy State Lama
    const newLeadsData = JSON.parse(JSON.stringify(localLeads));
    let leadToMove: any = null;

    // 2. CARI & AMBIL KARTU DARI KOLOM ASAL
    Object.keys(newLeadsData).forEach((key) => {
      const index = newLeadsData[key].findIndex((lead: any) => lead.id === targetLeadId);
      
      if (index !== -1) {
        // Potong (remove) kartu dari array kolom asal
        const [removedLead] = newLeadsData[key].splice(index, 1);
        leadToMove = removedLead;
      }
    });

    // 3. JIKA BUKAN DELETE, PINDAHKAN KE KOLOM TUJUAN (WON/LOST)
    if (leadToMove && confirmModal.type !== 'delete') {
       // Tentukan nama stage tujuan (Sesuaikan dengan slug di database/fixed stages)
       const targetStage = confirmModal.type === 'won' ? 'Won' : 'Lost';
       
       // Update data lokal kartu biar warnanya langsung berubah kalau ada logic warna
       leadToMove.stage = targetStage; 

       // Pastikan array kolom tujuan ada, kalau tidak buat array baru
       if (!newLeadsData[targetStage]) {
          newLeadsData[targetStage] = [];
       }

       // Masukkan kartu ke paling atas kolom tujuan
       newLeadsData[targetStage].unshift(leadToMove);
    }

    // 4. Update Layar Seketika (Optimistic)
    setLocalLeads(newLeadsData);
    
    const actionType = confirmModal.type; // Simpan tipe aksi sebelum state di-reset
    setConfirmModal({ open: false, type: null });

    // 5. Kirim Request ke Backend (Background Process)
    try {
      if (actionType === 'delete') {
        await apiClient.delete(`/leads/${targetLeadId}`);
      } else if (actionType === 'won') {
        await apiClient.patch(`/leads/${targetLeadId}`, { status: 'WON', stage: 'Won' });
      } else if (actionType === 'lost') {
        await apiClient.patch(`/leads/${targetLeadId}`, { status: 'LOST', stage: 'Lost' });
      }
    } catch (error) {
      console.error("Gagal melakukan aksi:", error);
      alert("Gagal memperbarui data, mengembalikan tampilan...");
      setLocalLeads(serverLeads); // Rollback jika server error
    } finally {
      setTargetLeadId(null);
    }
  };
  
  // --- SCROLL LOGIC (DIPERTAHANKAN) ---
  const scrollPipeline = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const syncThumb = () => {
    const scroll = scrollRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!scroll || !track || !thumb) return;

    const ratio = scroll.scrollLeft / (scroll.scrollWidth - scroll.clientWidth);
    const maxOffset = track.clientWidth - thumb.clientWidth;
    thumb.style.left = `${ratio * maxOffset}px`;
  };

  // --- GANTI USEEFFECT ANDA DENGAN INI ---
  useEffect(() => {
    // 1. Cek apakah elemen sudah ada. Jika loading, elemen ini null.
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const scroll = scrollRef.current;

    if (!track || !thumb || !scroll) return;

    // --- LOGIKA 1: DRAG THUMB (Mouse ditarik) ---
    let isDragging = false;
    let startX = 0;
    let startLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      // Ambil posisi left saat ini (parse dari style "10px" jadi angka 10)
      startLeft = parseFloat(thumb.style.left || "0"); 
      
      document.body.style.userSelect = "none"; // Matikan seleksi teks
      document.body.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.clientWidth;
      const maxThumbLeft = trackWidth - thumbWidth;
      
      // Hitung posisi baru thumb (dibatasi 0 sampai max)
      let newLeft = startLeft + deltaX;
      if (newLeft < 0) newLeft = 0;
      if (newLeft > maxThumbLeft) newLeft = maxThumbLeft;

      // 1. Gerakkan Thumb
      thumb.style.left = `${newLeft}px`;

      // 2. Gerakkan Konten Utama (Scroll)
      // Rumus: (Posisi Thumb / Ruang Gerak Thumb) * Ruang Gerak Scroll
      const scrollRatio = newLeft / maxThumbLeft;
      const maxScrollLeft = scroll.scrollWidth - scroll.clientWidth;
      
      scroll.scrollLeft = scrollRatio * maxScrollLeft;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    // --- LOGIKA 2: SYNC SAAT KONTEN DISCROLL (Trackpad/Mousewheel) ---
    const onScroll = () => {
      if (isDragging) return; // Jangan ganggu kalau lagi didrag mouse
      
      const trackWidth = track.clientWidth;
      const thumbWidth = thumb.clientWidth;
      const maxThumbLeft = trackWidth - thumbWidth;
      
      const maxScrollLeft = scroll.scrollWidth - scroll.clientWidth;
      if (maxScrollLeft <= 0) return;

      const scrollRatio = scroll.scrollLeft / maxScrollLeft;
      const newLeft = scrollRatio * maxThumbLeft;

      thumb.style.left = `${newLeft}px`;
    };

    // Pasang Event Listener
    thumb.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    scroll.addEventListener("scroll", onScroll);

    // Initial Sync (Posisikan thumb saat data baru muncul)
    onScroll();

    return () => {
      thumb.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      scroll.removeEventListener("scroll", onScroll);
    };
    
    // PENTING: Jalankan ulang efek ini jika loading selesai atau data berubah
  }, [isLoading, localLeads]);

  // --- CONDITIONAL RENDERING (LOADING/ERROR) ---
  if (isLoading) {
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Memuat data Leads...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600 dark:text-gray-400">Terjadi kesalahan saat memuat data: {error}</div>;
  }

  const renderData = localLeads || {};

  // --- TAMBAHKAN FUNGSI INI UNTUK MENGHITUNG TOTAL DARI LOCAL STATE ---
  const calculateStageTotal = (stageSlug: string) => {
    // 1. Ambil data leads yang sedang tampil di layar (Local State)
    const currentLeads = localLeads ? localLeads[stageSlug] : [];

    if (!currentLeads) return 0;

    // 2. Jumlahkan value-nya secara manual
    return currentLeads.reduce((sum: number, lead: any) => {
      // Pastikan value dikonversi jadi angka (jaga-jaga kalau string)
      return sum + (Number(lead.value) || 0);
    }, 0);
  };

  return (
    <>
    <div className="h-full flex flex-col">
      {/* === HEADER === */}
      <div className="flex items-center justify-between mb-2"> 
        <div>
          <h2 className="text-xl font-semibold text-[#2E2E2E] dark:text-white">Leads</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400  mt-1">Showing data from current month</p>
        </div>

        <div className="flex items-center gap-3">
          {/* TOMBOL 1: ADD LEAD (PRIMARY) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#5A4FB5] hover:bg-[#4a4194] text-white px-5 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} /> Add Lead
          </button>

          {/* TOMBOL 2: AI CHAT (SECONDARY / DEV) */}
          <button 
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-700  bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300  px-5 py-1.5 rounded-full text-sm font-medium transition-colors opacity-60 cursor-not-allowed"
          >
            <Bot size={16} /> AI Chat
          </button>
        </div>
      </div>

      {/* === TOOLBAR === */}
      <div className="flex flex-wrap items-center gap-3 mb-4 mt-1">
        <div className="flex bg-[#B4A3FF]/40 dark:bg-[#B4A3FF]/20  px-1.5 py-1.5 rounded-full">
          <button 
            onClick={() => setViewMode("kanban")}
            className={`p-1 rounded-full transition-all ${
              viewMode === 'kanban' 
                ? "bg-[#5A4FB5] text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button 
             onClick={() => setViewMode("list")}
             className={`p-1 rounded-full transition-all ${
              viewMode === 'list' 
                ? "bg-[#5A4FB5] text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700"
            }`}
          >
            <List size={14} />
          </button>
        </div>

        <button className="flex items-center gap-1 border border-gray-300 dark:border-gray-700  px-3 py-1.5 rounded-full text-sm bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700  text-black dark:text-white transition-colors">
          <Archive size={14} /> Archive
        </button>

        {/* --- TOMBOL FILTER DROPDOWN --- */}
        <div className="relative" ref={filterRef}>
             <button 
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 className={`flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm transition font-medium 
                    ${isFilterOpen || appliedFilters.source || appliedFilters.picId || appliedFilters.startDate 
                        ? 'bg-[#5A4FB5] text-white border-[#5A4FB5]' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
             >
               <Filter size={14} /> Filters
               {(appliedFilters.picId || appliedFilters.source || appliedFilters.startDate) && (
                  <span className="flex h-2 w-2 rounded-full bg-red-400 ml-1"></span>
               )}
             </button>
             
             {/* --- ISI FILTER (DROPDOWN / POPOVER) --- */}
             {isFilterOpen && (
               <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Filter Leads</h3>
                   <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
                 </div>
                 
                 <div className="space-y-4">
                     
                     {/* 1. RENTANG TANGGAL (Tanpa Preset) */}
                     <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Calendar size={12}/> Rentang Tanggal
                         </label>
                         <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                             <div className="w-1/2">
                                 <span className="text-[9px] text-gray-500 block mb-0.5">Mulai</span>
                                 <input type="date" value={tempFilters.startDate} onChange={(e) => handleTempFilterChange('startDate', e.target.value)} className="w-full text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 dark:text-white focus:outline-none focus:border-[#5A4FB5]" />
                             </div>
                             <div className="w-1/2">
                                 <span className="text-[9px] text-gray-500 block mb-0.5">Sampai</span>
                                 <input type="date" value={tempFilters.endDate} onChange={(e) => handleTempFilterChange('endDate', e.target.value)} className="w-full text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 dark:text-white focus:outline-none focus:border-[#5A4FB5]" />
                             </div>
                         </div>
                     </div>

                     <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                     {/* 2. DIMENSI FILTER (PIC, Status, Label, Source) */}
                     <div>
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Kriteria Lain</label>
                       <div className="space-y-3">
                         
                         {/* PIC (Owner) */}
                         {["ADMIN"].includes(currentUserRole) && (
                         <div>
                           <label className="text-[10px] text-gray-500 mb-1 block">PIC / Owner</label>
                           <select 
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md dark:text-white focus:ring-1 focus:ring-[#5A4FB5] outline-none"
                              value={tempFilters.picId} 
                              onChange={(e) => handleTempFilterChange('picId', e.target.value)}
                           >
                               <option value="">Semua PIC</option>
                               {teamMembers.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                           </select>
                         </div>
                         )}

                         {/* Status (Stage) */}
                         <div>
                           <label className="text-[10px] text-gray-500 mb-1 block">Status (Stage)</label>
                           <select 
                              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md dark:text-white focus:ring-1 focus:ring-[#5A4FB5] outline-none"
                              // Sementara pakai 'search' jika backend belum support 'status' field terpisah
                              value={tempFilters.status || ""} 
                              onChange={(e) => handleTempFilterChange('status', e.target.value)}
                           >
                               <option value="">Semua Status</option>
                               {FIXED_STAGES.map(s => <option key={s.slug} value={s.title}>{s.title}</option>)}
                           </select>
                         </div>

                         <div className="grid grid-cols-2 gap-2">
                             {/* Label */}
                             <div>
                               <label className="text-[10px] text-gray-500 mb-1 block">Label</label>
                               <select 
                                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md dark:text-white focus:ring-1 focus:ring-[#5A4FB5] outline-none"
                                  value={tempFilters.labelId} 
                                  onChange={(e) => handleTempFilterChange('labelId', e.target.value)}
                               >
                                   <option value="">Semua Label</option>
                                   {labelsList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                               </select>
                             </div>
                             {/* Source */}
                             <div>
                               <label className="text-[10px] text-gray-500 mb-1 block">Sumber</label>
                               <select 
                                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md dark:text-white focus:ring-1 focus:ring-[#5A4FB5] outline-none"
                                  value={tempFilters.source} 
                                  onChange={(e) => handleTempFilterChange('source', e.target.value)}
                               >
                                   <option value="">Semua Sumber</option>
                                   <option value="Website">Website</option>
                                   <option value="LinkedIn">LinkedIn</option>
                                   <option value="Referral">Referral</option>
                                   <option value="Ads">Ads</option>
                               </select>
                             </div>
                         </div>

                       </div>
                     </div>

                     {/* 3. TOMBOL AKSI */}
                     <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                         <button 
                           onClick={handleResetFilter} 
                           className="flex-1 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition"
                         >
                           Reset
                         </button>
                         <button 
                           onClick={handleApplyFilter} 
                           className="flex-1 py-2 text-xs font-medium bg-[#5A4FB5] text-white rounded-md hover:bg-[#483D9B] transition shadow-sm"
                         >
                           Apply Filters
                         </button>
                     </div>
                 </div>
               </div>
             )}
        </div>
      </div>
      
    <div className="flex-1 overflow-y-auto">
      {viewMode === 'kanban' ? (
      <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full">
      {/* === SCROLLBAR === */}
      <div className="sticky top-0 z-10 flex items-center -mb-4 gap-2 px-1">
        <button
          onClick={() => scrollPipeline("left")}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div ref={trackRef} className="relative flex-1 h-1.5 bg-gray-200 dark:bg-gray-700  rounded-full cursor-pointer">
          <div
            ref={thumbRef}
            className="absolute top-0 left-0 h-2 bg-[#B4A3FF] dark:bg-[#7a6fd6] rounded-full w-1/6 cursor-grab active:cursor-grabbing"
          />
        </div>

        <button
          onClick={() => scrollPipeline("right")}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* === LEAD COLUMNS (INTEGRASI DATA BACKEND) === */}
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-6 -mt-12 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* LOOP MENGGUNAKAN STAGES DARI HOOK */}
          {stages.map((stage, idx) => (
                  <div key={stage.slug || idx} style={{ flex: "0 0 260px" }}>
            <LeadColumn
              title={stage.title}
                      stageId={stage.slug}
                      amount={calculateStageTotal(stage.slug)}
                      leads={renderData[stage.slug]?.length || 0}
                      stageLeads={renderData[stage.slug] || []}
                      onAdd={() => setIsModalOpen(true)}
                      onSelectCard={setSelectedId}
                      selectedId={selectedId}
                      onDeleteCard={(id) => {
                         setTargetLeadId(id);
                         setConfirmModal({ open: true, type: "delete" });
                      }}
            />
          </div>
          ))}
        </div>
      </div>

      {/* === FOOTER ACTION BAR === */}
      <div className="sticky bottom-0 z-20 w-full bg-white dark:bg-gray-900  border-t border-gray-100 dark:border-gray-800  px-6 py-4 flex justify-center gap-6 rounded-t-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            
            {/* 1. DELETE ZONE */}
            <Droppable droppableId="delete-zone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    w-64 h-12 border-2 border-dashed rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center transition-all
                    ${snapshot.isDraggingOver 
                        ? "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-600 dark:text-red-400 scale-105" 
                        : "bg-white dark:bg-gray-800 border-[#C11106] dark:border-red-900 text-black dark:text-gray-300"}
                  `}
                >
                  DELETE
                  <div style={{ display: 'none' }}>
                  {provided.placeholder}
                </div>
              </div>
            )}
            </Droppable>

            {/* 2. WON ZONE */}
            <Droppable droppableId="won-zone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    w-64 h-12 border-2 border-dashed rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center transition-all
                    ${snapshot.isDraggingOver 
                        ? "bg-green-100 dark:bg-green-900/30 border-green-600 text-green-700 dark:text-green-400 scale-105" 
                        : "bg-white dark:bg-gray-800 border-[#257047] dark:border-green-900 text-black dark:text-gray-300"}
                  `}
                >
                  WON
                  <div style={{ display: 'none' }}>
                  {provided.placeholder}
                </div>
              </div>
            )}
            </Droppable>

            {/* 3. LOST ZONE */}
            <Droppable droppableId="lost-zone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    w-64 h-12 border-2 border-dashed rounded-xl font-bold text-lg uppercase tracking-wider flex items-center justify-center transition-all
                    ${snapshot.isDraggingOver 
                        ? "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-600 dark:text-red-400 scale-105" 
                        : "bg-white dark:bg-gray-800 border-[#5A4FB5] dark:border-[#5A4FB5]/50 text-black dark:text-gray-300"}
                  `}
                >
                  LOST
                  <div style={{ display: 'none' }}>
                  {provided.placeholder}
                </div>
              </div>
            )}
            </Droppable>
            </div>
          </div>
        </DragDropContext>
      ) : (
        // === MODE LIST ===
        <div className="h-full overflow-y-auto pt-2">
            <LeadListView leads={localLeads ? Object.values(localLeads).flat() as any[] : []} />
        </div>
      )}
    </div>
    </div>

      <AddLeadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refresh} />
      <ConfirmationModal
        open={confirmModal.open}
        type={confirmModal.type}
        onClose={() => setConfirmModal({ open: false, type: null })}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}