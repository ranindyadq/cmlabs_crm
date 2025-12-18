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
} from "lucide-react";

import ProfileTab from "./profile-tabs/ProfileTab";
import AccountTab from "./profile-tabs/AccountTab";
import NotificationTab from "./profile-tabs/NotificationTab";
import OrganizationTab from "./profile-tabs/OrganizationTab";

export default function ProfilePage() {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Ambil data user dari localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserRole(parsed.role); // 'ADMIN' atau 'USER'
    }
  }, []);

  const [activeTab, setActiveTab] = useState<"profile" | "account" | "notifications" | "organization">("profile");
    

  return (
    <div className="h-screen flex flex-col">

      {/* TITLE + GRADIENT */}
      <div className="relative w-full mb-4">
        <div className="bg-[#5A4FB5] text-white py-6 px-8 rounded-t-2xl">
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm text-white mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="w-full overflow-hidden leading-none">
          <svg
            className="w-full h-[78px] block"
            viewBox="0 0 1440 78"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="purpleBlock" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5A4FB5" />
                <stop offset="100%" stopColor="#CAA9FF" />
              </linearGradient>

              <filter id="limeSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="1440" height="130" fill="url(#purpleBlock)" />

            <path d="M0,12 C220,35 480,-5 720,18 C980,42 1200,-2 1440,15"
              stroke="#D9FF6A" strokeWidth="2.6" fill="none" opacity="0.95" filter="url(#limeSoftGlow)" />
            <path d="M0,25 C260,55 480,5 720,32 C960,60 1200,10 1440,28"
              stroke="#D9FF6A" strokeWidth="2.5" fill="none" opacity="0.85" filter="url(#limeSoftGlow)" />
            <path d="M0,38 C280,70 480,20 720,45 C960,72 1180,25 1440,42"
              stroke="#D9FF6A" strokeWidth="2.4" fill="none" opacity="0.78" filter="url(#limeSoftGlow)" />
            <path d="M0,50 C240,82 480,32 720,58 C960,85 1200,40 1440,55"
              stroke="#D9FF6A" strokeWidth="2.3" fill="none" opacity="0.7" filter="url(#limeSoftGlow)" />
          </svg>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-5 items-start flex-1 h-full">

        {/* LEFT CARD */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 h-fit">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow">
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                <User size={48} className="text-gray-500" />
              </div>
            </div>

            <h2 className="mt-4 text-lg font-semibold">Mahendra</h2>

            <span className="px-3 py-1 mt-2 text-xs rounded-full bg-gray-100 text-[#137337] flex items-center gap-1">
              <span className="w-2 h-2 bg-[#137337] rounded-full"></span>
              Active
            </span>
          </div>

          <div className="my-5 border-t" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-gray-500" />
              <span>+62-xxxx-xxxx</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-gray-500" />
              <span>Indonesia</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail size={15} className="text-gray-500" />
              <span>email@example.com</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="col-span-2 bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col overflow-hidden h-full">

          {/* TABS */}
          <div className="flex justify-center border-b border-gray-200 pt-2 pb-1">
            <div className="flex items-center gap-10">

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex flex-col items-center px-6 py-3 font-medium ${
                  activeTab === "profile" ? "text-[#5A4FB5]" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <User size={20} /> Profile
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "profile" ? "bg-[#5A4FB5]" : "bg-transparent"
                  }`}
                />
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`flex flex-col items-center px-6 py-3 font-medium ${
                  activeTab === "account" ? "text-[#5A4FB5]" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Lock size={20} /> Account
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "account" ? "bg-[#5A4FB5]" : "bg-transparent"
                  }`}
                />
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex flex-col items-center px-6 py-3 font-medium ${
                  activeTab === "notifications" ? "text-[#5A4FB5]" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Bell size={20} /> Notifications
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "notifications" ? "bg-[#5A4FB5]" : "bg-transparent"
                  }`}
                />
              </button>
                {userRole === "ADMIN" && (
                <button
                  onClick={() => setActiveTab("organization")}
                  className={`flex flex-col items-center px-6 py-3 font-medium ${
                    activeTab === "organization" ? "text-[#5A4FB5]" : "text-gray-500"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Building size={20} /> Organization
                  </span>
                  <div className={`w-full h-[3px] rounded-full mt-1 ${activeTab === "organization" ? "bg-[#5A4FB5]" : "bg-transparent"}`} />
                </button>
                )}
            </div>
            
          </div>

          {/* SCROLLABLE TAB CONTENT */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "account" && <AccountTab />}
            {activeTab === "notifications" && <NotificationTab />}
            {activeTab === "organization" && userRole === "ADMIN" && <OrganizationTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
