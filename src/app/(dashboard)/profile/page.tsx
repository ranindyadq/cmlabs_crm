"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  User,
  Lock,
  Bell,
  Building,
  Loader2,
  Camera,
  Briefcase,
  Rocket,
  Pause,
  Circle
} from "lucide-react";

import ProfileTab from "./profile-tabs/ProfileTab";
import AccountTab from "./profile-tabs/AccountTab";
import NotificationTab from "./profile-tabs/NotificationTab";
import OrganizationTab from "./profile-tabs/OrganizationTab";
import Image from "next/image";
import { useRef } from "react";

function hexWithAlpha(hex: string, alphaHex = "1A") {
  if (!hex) return "transparent";
  if (hex.length === 7) return `${hex}${alphaHex}`;
  return hex;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
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

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string | { id: string; name: string };
  status: string;
  workInfo?: {
    location?: string;
    bio?: string;
    skills?: string[];
  };
  photo?: string | null;
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large (Max 2MB)"); 
      return;
    }

    try {
      setIsUploading(true); 
      
      const formData = new FormData();
      formData.append("file", file); 

      // 1. Panggil API Upload
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        const newPhotoUrl = json.data.url;

        // A. Update UI di halaman Profile ini (agar gambar di sidebar kiri berubah)
        if (userData) {
            setUserData({
                ...userData,
                photo: newPhotoUrl
            });
        }

        // ============================================================
        // 🔥 TAMBAHAN LOGIKA UPDATE HEADER REALTIME 🔥
        // ============================================================

        // B. Update LocalStorage (agar Layout.tsx mengambil foto baru)
        const oldUserLocal = localStorage.getItem("user");
        if (oldUserLocal) {
            const parsedUser = JSON.parse(oldUserLocal);
            const updatedUser = { ...parsedUser, photo: newPhotoUrl };
            
            localStorage.setItem("user", JSON.stringify(updatedUser));
            sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }

        // C. Trigger Event (agar Layout.tsx merender ulang Header)
        window.dispatchEvent(new Event("user-updated"));
        
        // ============================================================

      } else {
        alert(json.message || "Failed to upload photo");
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("System error occurred");
    } finally {
      setIsUploading(false);
    }
  };
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile"); // Panggil Backend kamu
      if (res.ok) {
        const json = await res.json();
        setUserData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications" | "organization">("profile");
  
  const getRoleName = (): string => {
    if (!userData) return "";
    // Jika role adalah object, ambil .name, jika string ambil langsung
    if (typeof userData.role === 'object' && userData.role !== null) {
      return userData.role.name;
    }
    return userData.role || "";
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#5A4FB5]" /></div>;
  }
  
  // Pastikan data ada sebelum render
  if (!userData) return null;

  // --- 2. LOGIKA RENDER STATUS ---
  const statusKey = (userData.status || "ACTIVE").toUpperCase();
  // Ambil config, fallback ke active
  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="h-full w-full bg-[#F0F2F5] pb-10 overflow-y-auto no-scrollbar">

      {/* =========================================
          1. HEADER & COVER CONTAINER (GABUNG)
         ========================================= */}
      {/* Container utama untuk Header + Cover */}
      <div className="max-w-6xl mx-auto mt-1 bg-white rounded-t-2xl overflow-hidden shadow-sm">
        
        {/* A. BAGIAN JUDUL (WHITE HEADER) */}
        <div className="px-8 py-3 bg-white">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        {/* B. BAGIAN COVER (GRADIENT) - MENEMPEL LANGSUNG DI BAWAH JUDUL */}
        <div className="relative w-full h-[140px]">
          
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5A4FB5] to-[#9182F8]"></div>

          {/* Dekorasi (Shapes) agar lebih estetik */}
          <div className="absolute top-6 left-1/4 w-4 h-4 bg-white/30 rotate-45 blur-[1px]"></div>
          <div className="absolute top-10 left-1/2 w-3 h-3 bg-white/20 rotate-45"></div>
          <div className="absolute top-16 right-1/3 w-5 h-5 bg-white/10 rotate-45"></div>
          <div className="absolute top-8 right-16 w-8 h-8 border border-white/30 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]"></div>
          <div className="absolute bottom-10 right-1/4 w-12 h-12 border-2 border-white/10 rounded-full"></div>
          <div className="absolute top-5 left-10 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
          
          {/* Soft Glow Effect */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 blur-3xl rounded-full mix-blend-overlay"></div>
        </div>
      </div>


      {/* 2. MAIN CONTAINER (Menumpuk di atas cover) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* === LEFT SIDEBAR (Profile Summary) === */}
          <aside className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center h-fit">
            
            {/* Avatar (Floating Up) */}
            <div className="-mt-16 mb-4 relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 shadow-md flex items-center justify-center overflow-hidden relative">
          
                {/* LOGIKA TAMPILAN FOTO */}
                {userData.photo ? (
                  <Image 
                    src={userData.photo} 
                    alt={userData.fullName}
                    fill // Agar gambar memenuhi lingkaran
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  // Default jika tidak ada foto
                  <User size={64} className="text-gray-400" />
                )}

                {/* Loading Overlay saat upload */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Tombol Edit / Kamera */}
              <button 
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-white hover:bg-gray-100 p-2 rounded-full border border-gray-200 shadow-sm transition text-gray-600 cursor-pointer z-20"
                title="Change Profile Photo"
              >
                <Camera size={18} />
              </button>

              {/* Input File Tersembunyi (Invisible) */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg"
                className="hidden" 
              />
          </div>

            {/* Name & Role */}
            <h2 className="text-lg font-semibold">{userData.fullName || "User"}</h2>
            
            <div className="mt-3 flex flex-col gap-2 w-full">
            {/* Status Pill */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1 text-xs font-semibold uppercase tracking-wide rounded-full"
                style={{
                    backgroundColor: hexWithAlpha(statusInfo.color, "1A"), // Transparansi 10%
                    color: statusInfo.color
                }}
              >
                 {/* Render Icon Dinamis */}
                 <StatusIcon size={14} strokeWidth={2.5} />
                 {userData.status || "Active"}
              </span>
            </div>
          </div>

            <div className="w-full border-t border-gray-200 my-6" />

            {/* Contact Info List */}
            <div className="w-full space-y-3 text-sm text-left px-2">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={15} />
                <span className="truncate">{userData.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin size={18} />
                <span className="truncate">{userData.workInfo?.location || "No location"}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} />
                <span className="truncate" title={userData.email}>{userData.email}</span>
              </div>
            </div>
          </aside>


          {/* === RIGHT CONTENT (Tabs & Forms) === */}
          <main className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-fit">
            
            {/* Tab Navigation Header */}
            <div className="px-6 pt-4 border-b border-gray-200">
              <div className="flex gap-14 overflow-x-auto justify-center">
                
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "profile" ? "text-[#5A4FB5]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User size={18} /> Profile
                  {activeTab === "profile" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5A4FB5] rounded-t-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("account")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "account" ? "text-[#5A4FB5]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Lock size={18} /> Account
                  {activeTab === "account" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5A4FB5] rounded-t-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "notifications" ? "text-[#5A4FB5]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Bell size={18} /> Notifications
                  {activeTab === "notifications" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5A4FB5] rounded-t-full" />
                  )}
                </button>

                {getRoleName() === "ADMIN" && (
                  <button
                    onClick={() => setActiveTab("organization")}
                    className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                      activeTab === "organization" ? "text-[#5A4FB5]" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Building size={18} /> Organization
                    {activeTab === "organization" && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#5A4FB5] rounded-t-full" />
                    )}
                  </button>
                )}

              </div>
            </div>

            {/* Tab Content Area */}
            <div className="p-6 flex-1">
              {activeTab === "profile" && (
                <ProfileTab initialData={{
                    ...userData,
                    role: getRoleName(), // Kita paksa jadi string disini
                  }} onUpdateSuccess={fetchProfile} />
              )}
              {activeTab === "account" && <AccountTab />}
              {activeTab === "notifications" && <NotificationTab />}
              {activeTab === "organization" && getRoleName() === "ADMIN" && <OrganizationTab />}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}