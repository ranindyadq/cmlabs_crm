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
} from "lucide-react";

import ProfileTab from "./profile-tabs/ProfileTab";
import AccountTab from "./profile-tabs/AccountTab";
import NotificationTab from "./profile-tabs/NotificationTab";
import OrganizationTab from "./profile-tabs/OrganizationTab";
import Image from "next/image";
import { useRef } from "react";

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
      alert("File terlalu besar (Maks 2MB)"); // Bisa ganti toast.error
      return;
    }

    try {
      setIsUploading(true); // Pastikan state loading nyala
      
      const formData = new FormData();
      // PENTING: Key harus "file" agar cocok dengan Backend di atas
      formData.append("file", file); 

      // PENTING: URL Fetch ke /api/profile/photo
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json(); // Baca response backend

      if (res.ok) {
        // SUKSES
        // Kita update state userData secara manual agar UI langsung berubah tanpa refresh halaman
        if (userData && json.data?.url) {
            setUserData({
                ...userData,
                photo: json.data.url
            });
        }
        // Atau panggil fetchProfile() untuk memuat ulang dari server
        // fetchProfile(); 
      } else {
        alert(json.message || "Gagal mengupload foto");
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsUploading(false); // Matikan loading
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

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* 1. HEADER JUDUL (Putih, Terpisah di Atas) */}
      <div className="bg-[#5A4FB5] border-b border-gray-200 px-7 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl text-white font-semibold">Profile</h1>
          <p className="text-sm text-white mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>
      
      {/* 1. COVER IMAGE AREA (Abu-abu di atas) */}
      <div className="h-40 w-full bg-gradient-to-r from-gray-300 to-gray-400 relative">
      </div>

      {/* 2. MAIN CONTAINER (Menumpuk di atas cover) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row min-h-[600px]">
          
          {/* === LEFT SIDEBAR (Profile Summary) === */}
          <aside className="w-full md:w-80 border-b md:border-r border-gray-200 p-6 flex flex-col items-center text-center">
            
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
                 <span className="px-4 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-gray-800 text-white">
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
          <main className="flex-1 flex flex-col">
            
            {/* Tab Navigation Header */}
            <div className="px-6 pt-4 border-b border-gray-200">
              <div className="flex gap-8 overflow-x-auto">
                
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "profile" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User size={18} /> Profile
                  {activeTab === "profile" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900 rounded-t-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("account")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "account" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Lock size={18} /> Account
                  {activeTab === "account" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900 rounded-t-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === "notifications" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Bell size={18} /> Notifications
                  {activeTab === "notifications" && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900 rounded-t-full" />
                  )}
                </button>

                {getRoleName() === "ADMIN" && (
                  <button
                    onClick={() => setActiveTab("organization")}
                    className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                      activeTab === "organization" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Building size={18} /> Organization
                    {activeTab === "organization" && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900 rounded-t-full" />
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