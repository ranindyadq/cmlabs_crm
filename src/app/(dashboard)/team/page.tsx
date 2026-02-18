"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import apiClient from "@/lib/apiClient";
import {
  Search,
  Plus,
  Circle,
  Pause,
  Briefcase,
  Rocket,
  Mail,
  Users,
  ArrowRight,
  Ellipsis,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import AddTeamModal from "./AddTeamModal";
import Link from "next/link";
import toast from "react-hot-toast";
import EditDeleteModals from "./EditDeleteModals";

// --- TIPE DATA & HELPER ---
type MemberStatus = "active" | "inactive" | "onboarding" | "onleave";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  status: string;
  photo?: string;
  roleName: string;
  roleTitle: string;
  department: string;
  joinedAt?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  reportsTo?: string;
}

const STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { 
    label: "Active", 
    color: "#137337", 
    // Ikon Titik Penuh (Solid)
    icon: (props: any) => <Circle {...props} size={8} fill="currentColor" strokeWidth={0} /> 
  },
  INACTIVE: { 
    label: "Inactive", 
    color: "#DC2626", 
    icon: Pause 
  },
  ONBOARDING: { 
    label: "Onboarding", 
    color: "#2563EB", 
    icon: Rocket 
  },
  ON_LEAVE: { // Hati-hati: Pakai Underscore sesuai Prisma Enum
    label: "On Leave", 
    color: "#D97706", 
    icon: Briefcase 
  }
};

function hexWithAlpha(hex: string, alphaHex = "1A") { // 1A = sktr 10% opacity
  if (!hex) return "transparent";
  if (hex.length === 7) return `${hex}${alphaHex}`;
  return hex;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);     // 🔥 State Modal Edit
  const [showDelete, setShowDelete] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await apiClient.get("/profile"); 
        const user = res.data.data;
        
        // Normalisasi nama role (huruf besar semua)
        const roleName = typeof user.role === 'object' && user.role !== null 
            ? user.role.name.toUpperCase() 
            : (user.role || "").toUpperCase();
        
        setUserRole(roleName); // Simpan ke state

        // ATURAN 1: Sales DILARANG MASUK
        // Izinkan: ADMIN, OWNER, PROJECT MANAGER (sesuaikan string database Anda)
        const allowedRoles = ['ADMIN', 'OWNER', 'PROJECT MANAGER', 'PROJECT_MANAGER'];
        
        if (!allowedRoles.includes(roleName)) {
           toast.error("Access denied: This area is restricted.");
           router.push("/dashboard"); 
           return; 
        } else {
           setIsCheckingAuth(false); 
        }

      } catch (error) {
        console.error(error);
        router.push("/dashboard"); // Safety net
      }
    };
    checkAccess();
  }, [router]);

  // 2. FETCH TEAM DATA
  const fetchTeam = async () => {
    try {
      setLoading(true);
      // Pastikan endpoint API ini benar
      const res = await fetch(`/api/team?search=${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store"},
        cache: "no-store"
      });
      const result = await res.json();
      setMembers(result.data || []);
    } catch (error) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTeam();
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [query]);

  // 3. HANDLER MENU ACTION
  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); // Stop agar tidak tembus ke card/document
    
    // Toggle: Jika diklik ID yang sama -> tutup, jika beda -> buka
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  // 🔥 FUNGSI BARU UNTUK MEMBUKA MODAL EDIT
  const handleEditClick = (member: TeamMember) => {
    setSelectedMember(member); // Set data member ke state
    setShowEdit(true);         // Buka modal edit
    setActiveMenu(null);       // Tutup dropdown menu
  };

  // 🔥 FUNGSI BARU UNTUK MEMBUKA MODAL DELETE
  const handleDeleteClick = (member: TeamMember) => {
    setSelectedMember(member); // Set data member ke state
    setShowDelete(true);       // Buka modal delete
    setActiveMenu(null);       // Tutup dropdown menu
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await apiClient.delete(`/team/${id}`);
      toast.success("Successfully deleted");
      fetchTeam(); 
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const handleEdit = (member: TeamMember) => {
    toast("Edit feature coming soon", { icon: "🚧" });
  };

  // 3. HITUNG JUMLAH STATUS
  const counts = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        // 1. Normalisasi status dari DB ke Uppercase (misal: "Active" -> "ACTIVE")
        const s = m.status?.toUpperCase() || 'ACTIVE';
        
        // 2. Mapping ke key accumulator (huruf kecil)
        const keyMap: any = { 
            ACTIVE: 'active', 
            INACTIVE: 'inactive', 
            ONBOARDING: 'onboarding', 
            ON_LEAVE: 'onleave', // Sesuai Enum Prisma
            ONLEAVE: 'onleave'   // Jaga-jaga typo
        };

        // 3. Ambil key yang benar (misal: "active")
        const k = keyMap[s] || 'active';

        // 4. Update hitungan (Gunakan 'k', BUKAN 's')
        if (acc[k] !== undefined) {
            acc[k]++; // <--- PERBAIKAN DI SINI (sebelumnya acc[s]++)
        }
        
        return acc;
      },
      // Initial value (key huruf kecil)
      { active: 0, inactive: 0, onboarding: 0, onleave: 0 } as Record<string, number>
    );
  }, [members]);


  if (isCheckingAuth) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col p-2">
      {activeMenu && (
      <div 
        className="fixed inset-0 z-[40]" // Z-index 40 (di bawah dropdown, di atas konten)
        onClick={() => setActiveMenu(null)} 
      />
    )}
      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team Management</h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for team..."
              className="pl-9 pr-4 py-2 rounded-full border border-gray-200 w-full sm:w-64 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]/20"
            />
          </div>
          {(userRole === 'ADMIN' || userRole === 'OWNER') && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#5A4FB5] hover:bg-black text-white px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Add Team
          </button>
        )}
        </div>
      </div>

      {/* === STATUS OVERVIEW === */}
      <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500 flex-shrink-0 mb-3">
        {/* Render Manual untuk Overview juga biar ikonnya muncul */}
        <span className="flex items-center gap-1.5"><Circle size={8} fill="#137337" color="#137337" strokeWidth={0} /> Active {counts.active}</span>
        <span className="flex items-center gap-1.5"><Pause size={12} color="#DC2626" /> Inactive {counts.inactive}</span>
        <span className="flex items-center gap-1.5"><Rocket size={12} color="#2563EB" /> Onboarding {counts.onboarding}</span>
        <span className="flex items-center gap-1.5"><Briefcase size={12} color="#D97706" /> On Leave {counts.onleave}</span>
      </div>

      {/* === TEAM GRID (SESUAI WIREFRAME) === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 pb-10 
    overflow-y-auto no-scrollbar flex-1 content-start">
          {members.map((m) => {
            const statusKey = m.status?.toUpperCase() || "ACTIVE";
            const config = STATUS[statusKey] || STATUS.active;
            const Icon = config.icon;
            const isMenuOpen = activeMenu === m.id;

            return (
            <div
              key={m.id}
              // 🔥 Perbaikan Z-Index: Saat menu terbuka, z-index kartu naik drastis (z-50)
              className={`bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 p-3 flex flex-col justify-between h-full hover:shadow-md transition-all duration-200 w-full max-w-[320px] relative ${isMenuOpen ? 'z-50' : 'z-0'}`}
            >
                {/* 🔥 PERBAIKAN UTAMA 🔥
                   Pindahkan Tombol Menu ke Sini (Direct Child dari Kartu).
                   Menggunakan absolute positioning agar bebas dari padding/margin element lain.
                */}
                {(userRole === 'ADMIN' || userRole === 'OWNER') && (
                  <div className="absolute top-3 right-3 z-20">
                    <button 
                      onClick={(e) => toggleMenu(m.id, e)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors p-1.5 rounded-full cursor-pointer bg-transparent"
                    >
                      <Ellipsis size={20} />
                    </button>

                    {/* DROPDOWN MENU */}
                    {isMenuOpen && (
                    <div 
                      // 🔥 PENTING: z-[50] agar lebih tinggi dari overlay (z-40)
                      className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right z-[50]"
                    >
                      <button
                        // Ganti onClick menjadi onMouseDown untuk respons lebih instan (Opsional, tapi disarankan)
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah tembus ke overlay
                          handleEditClick(m);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 cursor-pointer"
                      >
                        <Pencil size={14} /> Edit Data
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleDeleteClick(m);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  )}
                  </div>
                )}

              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4 relative">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: hexWithAlpha(config.color, "1A"),
                    color: config.color,
                  }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                  {config.label || m.status}
                </div>
                {/* Tombol Ellipsis dihapus dari sini karena sudah dipindah ke atas */}
              </div>

              {/* 2. PROFILE SECTION */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 mb-3 border border-gray-100">
                   <img
                     src={m.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=random&color=fff`}
                     alt={m.fullName}
                     className="w-full h-full object-cover"
                   />
                </div>
                
                <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                  {m.fullName}
                </h3>
                <p className="text-[13px] text-gray-500 font-medium">
                {/* Hapus "UI UX Designer", ganti dengan m.roleTitle saja. 
                    Jika kosong, backend yang akan menangani default-nya, 
                    atau kita kasih fallback "-" */}
                {m.roleTitle || "-"} 
              </p>
              </div>

              {/* 3. INFO BOX (Email & Team) - WIREFRAME STYLE */}
              <div className="bg-[#F8F9FB] rounded-xl p-3 space-y-1 mb-2 border border-gray-50">
                <div className="flex items-center gap-2.5 text-[11px] text-gray-600 font-medium">
                  <Mail size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-600 font-medium">
                  <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                  <span>{m.department || "Developer Team"} Team</span>
                </div>
              </div>

              {/* 4. FOOTER KARTU */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <span>
                  Joined at {m.joinedAt 
                    ? new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) 
                    : "9 June 2025"}
                </span>
                
                <Link
                  href={`/team/${m.id}`}
                  className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors"
                >
                  View Details <ArrowRight size={10} />
                </Link>
              </div>

            </div>
          )})}

          {/* EMPTY STATE */}
          {members.length === 0 && !loading && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={48} className="mb-3 opacity-20" />
                <p>No team members found</p>
             </div>
          )}
        </div>

      {/* === MODALS === */}
      
      {/* 1. Add Modal */}
      <AddTeamModal 
        open={showAdd} 
        onClose={() => { setShowAdd(false); fetchTeam(); }} // Refresh setelah add
      />

      {/* 2. Edit & Delete Modal */}
      {selectedMember && (
        <EditDeleteModals
          openEdit={showEdit}
          openDelete={showDelete}
          
          onCloseEdit={() => { setShowEdit(false); fetchTeam(); }} 
          onCloseDelete={() => { setShowDelete(false); fetchTeam(); }}
          
          member={{
            id: selectedMember.id,
            name: selectedMember.fullName,
            email: selectedMember.email,
            phone: selectedMember.phone,
            
            role: selectedMember.roleName,   // Ini System Role (misal: SALES)
            roleTitle: selectedMember.roleTitle, // 🔥 TAMBAHKAN INI (misal: Senior Account Exec)
            
            status: selectedMember.status,
            dept: selectedMember.department,
            joined: selectedMember.joinedAt,
            location: selectedMember.location,
            bio: selectedMember.bio,
            skills: selectedMember.skills,
            reportsTo: selectedMember.reportsTo
          }}
        />
      )}
    </div>
  );
}