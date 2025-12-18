"use client"

import React, { useMemo, useState, useEffect } from "react"
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
} from "lucide-react"
import AddTeamModal from "./AddTeamModal"
import Link from "next/link";
import toast from "react-hot-toast";

type MemberStatus = "active" | "inactive" | "onboarding" | "onleave"

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  status: string;
  photo?: string;
  workInfo?: {
    roleTitle?: string;
    department?: string;
    joinedAt?: string;
  }
}

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#137337" },
  inactive: { label: "Inactive", color: "#313947" },
  onboarding: { label: "Onboarding", color: "#1c4acd" },
  onleave: { label: "On Leave", color: "#985c07" },
}

function hexWithAlpha(hex: string, alphaHex = "33") {
  if (!hex) return "transparent"
  if (hex.length === 7) return `${hex}${alphaHex}`
  return hex
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Fungsi Fetch Data dari API
 const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/team?search=${query}`);
      const result = await res.json();
      setMembers(result.data || []);
    } catch (error) {
      toast.error("Gagal memuat data tim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTeam();
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const counts = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        const s = m.status?.toLowerCase() || 'active';
        if (acc[s] !== undefined) acc[s]++;
        return acc;
      },
      { active: 0, inactive: 0, onboarding: 0, onleave: 0 } as Record<string, number>
    );
  }, [members]);

  const statusIcon = (status: string) => { 
    const s = status?.toLowerCase();
    if (s === "active") return <Circle size={12} />;
    if (s === "inactive") return <Pause size={12} />;
    if (s === "onleave") return <Briefcase size={12} />;
    if (s === "onboarding") return <Rocket size={12} />;
    return <Circle size={12} />;
  };

  return (
  <div className="space-y-6">

    {/* === HEADER === */}
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-xl font-semibold text-[#2E2E2E]">Team Management</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for team..."
            className="pl-9 pr-4 py-1.5 rounded-full border border-gray-300 w-56 bg-white text-sm"
          />
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-full bg-white text-black text-sm hover:bg-gray-50"
        >
          <Plus size={14} /> Add Team
        </button>
      </div>
    </div>

    {/* === STATUS OVERVIEW === */}
    <div className="flex gap-4 text-xs text-gray-600 mb-4">
      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#137337] rounded-full"></span> Active {counts.active}</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#313947] rounded-full"></span> Inactive {counts.inactive}</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1c4acd] rounded-full"></span> Onboarding {counts.onboarding}</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#985c07] rounded-full"></span> On Leave {counts.onleave}</span>
    </div>

    {/* === TEAM GRID === */}
    {loading ? (
        <div className="text-center py-10 text-gray-500">Loading team data...</div>
      ) : (
    <div className="grid grid-cols-4 gap-4">
      {members.map((m) => (
        <div
          key={m.id}
          className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >

          {/* Status Badge (INSIDE card, NOT floating) */}
          <div
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-3"
            style={{
              backgroundColor: hexWithAlpha(STATUS[m.status?.toLowerCase()]?.color || "#137337", "22"),
                  color: STATUS[m.status?.toLowerCase()]?.color || "#137337",
            }}
          >
            {statusIcon(m.status)}
            <span>{STATUS[m.status].label}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: "#e9e7ff" }}
            >
              <img
                src={m.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=random`}
                    alt={m.fullName}
              />
            </div>

            <div className="text-center">
              <div className="text-base font-semibold text-gray-900">{m.fullName}</div>
              <div className="text-xs text-gray-500">{m.workInfo?.roleTitle || "No Role"}</div>
            </div>

            <div className="w-full">
              <div className="bg-[#827bc6] bg-opacity-90 text-white rounded-lg px-3 py-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <Mail size={12} /> <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Users size={12} /> {m.workInfo?.department || "No Dept"}
                </div>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-[11px] text-gray-500 mt-2">
              <span>Joined {m.workInfo?.joinedAt ? new Date(m.workInfo.joinedAt).toLocaleDateString() : "-"}</span>
              <Link
                href={`/team/${m.id}`}
                className="flex items-center gap-1 text-gray-700 text-xs hover:underline"
              >
                View
                <ArrowRight size={12} />
              </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    <AddTeamModal open={showAdd} onClose={() => { setShowAdd(false); fetchTeam(); }} />
  </div>
  )
}