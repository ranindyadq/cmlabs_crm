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

// PROPS TYPE
interface TeamDetailProps {
  member: {
    id: string;
    name: string;
    role: string;
    dept: string;
    status: string;
    email: string;
    joined: string;
    bio: string;
    skills: string[];
    photo?: string;
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
  // Ambil data user dari localStorage yang disimpan saat login
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  const isAdminOrOwner = currentUser?.role === "ADMIN" || currentUser?.role === "OWNER";
  const isNotSelf = currentUser?.id !== member.id;

  const [activeTab, setActiveTab] = useState<
    "overview" | "deals" | "performance"
  >("overview");

const normalizedStatus = member.status.toLowerCase().replace("_", "") as keyof typeof STATUS;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* BACK */}
      <button
        onClick={() => router.push("/team")}
        className="flex items-center gap-1 text-sm text-gray-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Team
      </button>

      {/* MAIN GRID (left fixed + right scrollable) */}
      <div className="grid grid-cols-3 gap-6 overflow-hidden mt-2 items-start">
        {/* LEFT PROFILE CARD */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#d6d3ff] flex items-center justify-center overflow-hidden shadow">
              <img
                src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=d6d3ff&color=5A4FB5`}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="mt-4 text-lg font-semibold">{member.name}</h2>
            <p className="text-sm text-gray-500">{member.role}</p>

            {/* Dept + Status */}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 text-xs bg-gray-100 rounded-full">
                {member.dept}
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

          <div className="my-5 border-t" />

          {/* Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-gray-500" />
              <span>{member.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-gray-500" />
              <span>Joined at {member.joined}</span>
            </div>
          </div>

          <div className="my-5 border-t" />

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 text-sm">
            {isAdminOrOwner && (
              <>
            <button
              onClick={() => setOpenEdit(true)}
              className="px-4 py-2 bg-[#5A4FB5] text-white rounded-lg flex items-center gap-1 hover:bg-[#4b42a2]"
            >
              <Edit size={15} /> Edit
            </button>
            {isNotSelf && (
            <button
              onClick={() => setOpenDelete(true)}
              className="px-4 py-2 bg-[#5A4FB5] text-white rounded-lg flex items-center gap-1 hover:bg-[#4b42a2]"
            >
              <Trash2 size={15} /> Delete
            </button>
            )}
          </>
          )}
        </div>
        </div>

        {/* RIGHT PANEL (scrollable) */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* TABS CENTERED */}
          <div className="flex justify-center border-b border-gray-200 pt-2 pb-1">
            <div className="flex items-center gap-10">

              {/* OVERVIEW */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex flex-col items-center px-6 py-3 font-medium ${
                  activeTab === "overview" ? "text-[#5A4FB5]" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <UserRound size={20} strokeWidth={2.2} /> Overview
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "overview"
                      ? "bg-[#5A4FB5]"
                      : "bg-transparent"
                  }`}
                />
              </button>

              {/* DEALS */}
              <button
                onClick={() => setActiveTab("deals")}
                className={`flex flex-col items-center px-6 py-3 ${
                  activeTab === "deals" ? "text-[#5A4FB5]" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Layers size={18} /> Deals
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "deals"
                      ? "bg-[#5A4FB5]"
                      : "bg-transparent"
                  }`}
                />
              </button>

              {/* PERFORMANCE */}
              <button
                onClick={() => setActiveTab("performance")}
                className={`flex flex-col items-center px-6 py-3 ${
                  activeTab === "performance"
                    ? "text-[#5A4FB5]"
                    : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <LineChart size={18} /> Performance
                </span>
                <div
                  className={`w-full h-[3px] rounded-full mt-1 ${
                    activeTab === "performance"
                      ? "bg-[#5A4FB5]"
                      : "bg-transparent"
                  }`}
                />
              </button>

            </div>
          </div>

          {/* TAB CONTENT — scrollable */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === "overview" && <OverviewTab member={member} />}
            {activeTab === "deals" && <DealsTab memberId={member.id} />}
            {activeTab === "performance" && <PerformanceTab memberId={member.id} />}
            </div>
        </div>
      </div>
      
      {/* POPUP MODALS — remain unchanged */}
      <EditDeleteModals
        openEdit={openEdit}
        openDelete={openDelete}
        onCloseEdit={() => setOpenEdit(false)}
        onCloseDelete={() => setOpenDelete(false)}
        member={member}
      />
    </div>
  );
}
