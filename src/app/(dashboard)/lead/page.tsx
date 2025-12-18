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
} from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import LeadColumn from "./components/LeadColumn";
import AddLeadModal from "./components/AddLeadModal";
import ConfirmationModal from "./components/ConfirmationModal";
// --- IMPOR HOOK DAN API CLIENT ---
import useLeads from "@/hooks/useLeads"; // Mengimpor hook kustom untuk fetching data
import apiClient from "@/lib/apiClient";

export default function LeadsPage() {
  const { leads: serverLeads, stages, totalValues, isLoading, error, refresh } = useLeads();

// 1. STATE LOKAL (Optimistic UI)
  const [localLeads, setLocalLeads] = useState<any>(null);

  // 2. Sync Server Data ke Lokal
  useEffect(() => {
    if (serverLeads) {
      setLocalLeads(serverLeads);
    }
  }, [serverLeads]);

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

    // 1. Update UI Duluan (Optimistic Remove)
    const newLeadsData = JSON.parse(JSON.stringify(localLeads));
    let found = false;

    // Cari kartu di semua kolom dan hapus dari UI sementara
    Object.keys(newLeadsData).forEach((key) => {
      const filtered = newLeadsData[key].filter((lead: any) => lead.id !== targetLeadId);
      if (filtered.length !== newLeadsData[key].length) {
        newLeadsData[key] = filtered;
        found = true;
      }
    });

    if (found) setLocalLeads(newLeadsData);
    setConfirmModal({ open: false, type: null }); // Tutup modal segera

    // 2. Kirim Request ke Backend
    try {
      if (confirmModal.type === 'delete') {
        await apiClient.delete(`/leads/${targetLeadId}`);
      } else if (confirmModal.type === 'won') {
        await apiClient.patch(`/leads/${targetLeadId}`, { status: 'WON', stage: 'Won' });
      } else if (confirmModal.type === 'lost') {
        await apiClient.patch(`/leads/${targetLeadId}`, { status: 'LOST', stage: 'Lost' });
      }
    } catch (error) {
      console.error("Gagal melakukan aksi:", error);
      alert("Gagal memperbarui data.");
      setLocalLeads(serverLeads); // Rollback data asli jika error
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

  return (
    <>
    {/* Container Utama harus dibungkus DragDropContext */}
      <DragDropContext onDragEnd={onDragEnd}>
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
          <button className="p-1 rounded-full bg-[#5A4FB5] text-white">
            <LayoutGrid size={14} />
          </button>
          <button className="p-1 rounded-full text-black dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
            <List size={14} />
          </button>
        </div>

        <button className="flex items-center gap-1 border border-gray-300 dark:border-gray-700  px-3 py-1.5 rounded-full text-sm bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700  text-black dark:text-white transition-colors">
          <Archive size={14} /> Archive
        </button>

        <button className="flex items-center gap-1 border border-gray-300 dark:border-gray-700  px-3 py-1.5 rounded-full text-sm bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700  text-black dark:text-white transition-colors">
          <Filter size={14} /> Filters
        </button>
      </div>

    <div className="flex-1 overflow-y-auto">
      {/* === SCROLLBAR === */}
      <div className="flex items-center gap-2 mb-0 px-1 relative z-10">
        <button
          onClick={() => scrollPipeline("left")}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div ref={trackRef} className="relative flex-1 h-1.5 bg-gray-200 dark:bg-gray-700  rounded-full cursor-pointer">
          <div
            ref={thumbRef}
            className="absolute top-0 left-0 h-2 bg-[#B4A3FF] dark:bg-[#7a6fd6] rounded-full w-1/4 cursor-grab active:cursor-grabbing"
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
      <div className="overflow-hidden -mt-16">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-6 pt-0 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* LOOP MENGGUNAKAN STAGES DARI HOOK */}
          {stages.map((stage, idx) => (
                  <div key={stage.slug || idx} style={{ flex: "0 0 260px" }}>
            <LeadColumn
              title={stage.title}
                      stageId={stage.slug}
                      amount={totalValues[stage.slug] || 0}
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
                  {provided.placeholder}
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
                  {provided.placeholder}
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
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

          </div>
        </div>
      </DragDropContext>

      <AddLeadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={refresh} />
      <ConfirmationModal
        open={confirmModal.open}
        type={confirmModal.type}
        onClose={() => setConfirmModal({ open: false, type: null })}
        onConfirm={handleConfirmAction} // ✅ Menggunakan fungsi yang lengkap
      />
    </>
  );
}