"use client";

import {
  ArrowLeft,
  Mail,
  Calendar,
  Edit,
  Trash2,
  UserRound,
  Layers,
  LineChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import EditDeleteModals from "./EditDeleteModals";
import OverviewTab from "./team-tabs/OverviewTab";
import DealsTab from "./team-tabs/DealsTab";
import PerformanceTab from "./team-tabs/PerformanceTab";
import Image from "next/image";

// PROPS TYPE
interface TeamDetailProps {
  member: {
    id: string;
    name: string;
    role: string;
    roleTitle: string;
    dept: string;
    status: string;
    email: string;
    joined: string;
    bio: string;
    skills: string[];
    photo?: string;
    reportsTo: string;
    managerName: string | null;
    phone: string;
    location: string;
    dealsCount: number;
    deals: any[];
    performance: {
        kpis: {
            totalRevenue: number;
            winRate: number;
            avgDealSize: number;
            dealsClosedCount: number;
        };
        chartData: any[];
        quarterlyData: any[];
    };
  };
}

// STATUS MAPPING EXACT LIKE team/page.tsx
const STATUS = {
  active: { label: "Active", color: "#137337" },
  inactive: { label: "Inactive", color: "#313947" },
  onboarding: { label: "Onboarding", color: "#1c4acd" },
  onleave: { label: "On Leave", color: "#985c07" },
};

function hexWithAlpha(hex: string, alphaHex = "22") {
  return `${hex}${alphaHex}`;
}

export default function TeamDetail({ member }: TeamDetailProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (err) {
        console.error("Gagal parse user data", err);
      }
    } else {
        console.warn("⚠️ User data not found in Storage");
    }
  }, []);

  const getRoleName = (user: any) => {
    if (!user) return "";
    const r = user.role || user.roleName; 
    // Handle jika role berupa object {id, name} atau string
    const finalRole = (typeof r === 'object' && r !== null) ? r.name : r;
    return String(finalRole || "").toUpperCase();
  };

  const currentRole = getRoleName(currentUser);
  
  // Logic Hak Akses
  const isAdminOrOwner = currentRole === "ADMIN" || currentRole === "OWNER";
  const isNotSelf = currentUser?.id !== member.id;

  const [activeTab, setActiveTab] = useState<
    "overview" | "deals" | "performance"
  >("overview");

const normalizedStatus = member.status.toLowerCase().replace("_", "") as keyof typeof STATUS;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-2">
      {/* BACK */}
      <div className="flex-shrink-0 mb-4">
      <button
        onClick={() => router.push("/team")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Team
      </button>
      </div>

      {/* MAIN GRID (left fixed + right scrollable) */}
      <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden min-h-0 items-start">
        {/* LEFT PROFILE CARD */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 h-fit max-h-full overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 mb-3 border border-gray-100 shadow-sm flex items-center justify-center">
                <img
                    // Jika member.photo ada isinya -> Pakai Foto
                    // Jika kosong/null -> Pakai UI Avatars (Random Color)
                    src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    // Fallback jika URL foto rusak
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff`;
                    }}
                />
            </div>

            <h2 className="mt-3 text-lg font-semibold">{member.name}</h2>
            <p className="text-sm text-gray-500">{member.role}</p>

            {/* Dept + Status */}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 text-xs bg-gray-100 rounded-full">
                {member.dept} Team
              </span>

              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: hexWithAlpha(
                    STATUS[normalizedStatus].color
                  ),
                  color: STATUS[normalizedStatus].color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS[normalizedStatus].color }}
                />
                {STATUS[normalizedStatus].label}
              </span>
            </div>
          </div>

          <div className="my-4" />

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-gray-500" />
              <span>{member.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-gray-500" />
              <span>Joined at {member.joined}</span>
            </div>
          </div>

          <div className="my-4" />

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 text-sm">
            
            {/* Tombol Edit: Muncul jika Admin/Owner (Bisa edit siapa saja termasuk diri sendiri) */}
            {isAdminOrOwner && (
              <button
                onClick={() => setOpenEdit(true)}
                className="px-5 py-1 bg-[#5A4FB5] text-white rounded-lg flex items-center gap-1 hover:bg-[#4b42a2]"
              >
                <Edit size={15} /> Edit
              </button>
            )}

            {/* Tombol Delete: Muncul jika Admin/Owner DAN sedang melihat orang lain */}
            {isAdminOrOwner && isNotSelf && (
              <button
                onClick={() => setOpenDelete(true)}
                // Style tombol delete diperbaiki agar mirip wireframe (putih/merah)
                className="px-5 py-1 bg-white border border-gray-200 text-red-600 rounded-lg flex items-center gap-1 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            
          </div>
        </div>

        {/* RIGHT PANEL (scrollable) */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-fit max-h-full overflow-hidden">
          
          {/* TABS CENTERED */}
          {/* Tabs Navigation (Segmented Control Style) */}
          <div className="flex-shrink-0 px-4 pt-4 flex justify-center">
            {/* Container Abu-abu */}
            <div className="bg-gray-100 p-1 rounded-xl grid grid-cols-3 items-center w-full max-w-[610px]">
              
              {/* OVERVIEW */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all w-full ${
                  activeTab === "overview"
                    ? "bg-white text-gray-900 shadow-sm" // Style Aktif: Putih & Shadow
                    : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700" // Style Tidak Aktif
                }`}
              >
                <UserRound size={16} strokeWidth={2.5} /> Overview
              </button>

              {/* DEALS */}
              <button
                onClick={() => setActiveTab("deals")}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all w-full ${
                  activeTab === "deals"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
                }`}
              >
                <Layers size={16} strokeWidth={2.5} /> Deals
                {/* Badge Angka Dinamis */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${
                    activeTab === 'deals' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {/* 🔥 GANTI 0 JADI INI: */}
                  {member.dealsCount}
                </span>
              </button>

              {/* PERFORMANCE */}
              <button
                onClick={() => setActiveTab("performance")}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all w-full ${
                  activeTab === "performance"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
                }`}
              >
                <LineChart size={16} strokeWidth={2.5} /> Performance
              </button>

            </div>
          </div>

          {/* TAB CONTENT — scrollable */}
          <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
            {activeTab === "overview" && <OverviewTab member={member} />}
            {activeTab === "deals" && (
              <DealsTab 
                deals={member.deals} // Kirim data dari database
              />
            )}
            {activeTab === "performance" && (
            <PerformanceTab data={member.performance} /> // 🔥 Kirim data langsung
              )}  
            </div>
        </div>
      </div>
      
      {/* POPUP MODALS — remain unchanged */}
      <EditDeleteModals
        openEdit={openEdit}
        openDelete={openDelete}
        onCloseEdit={() => setOpenEdit(false)}
        onCloseDelete={() => {
                setOpenDelete(false);
                router.push("/team"); // Redirect ke list setelah delete
            }}
        member={member}
      />
    </div>
  );
}
