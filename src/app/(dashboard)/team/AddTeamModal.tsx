"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  UserRound,
  Calendar,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

// Interface untuk data manager yang diambil dari API
interface ManagerOption {
  id: string;
  fullName: string;
  roleTitle: string;
}

export default function AddTeamModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleName, setRoleName] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [managerId, setManagerId] = useState(""); 
  const [managers, setManagers] = useState<ManagerOption[]>([]);

  useEffect(() => {
    if (open) {
      const fetchManagers = async () => {
        try {
          const res = await fetch("/api/team?limit=100");
          const json = await res.json();
          if (res.ok) {
            // TypeScript sekarang tahu tipe data json.data
            setManagers(json.data || []);
          }
        } catch (error) {
          console.error("Gagal mengambil data manager", error);
        }
      };
      fetchManagers();
    }
  }, [open]);

  const handleSubmit = async () => {

    // 1️⃣ CEK FIELD KOSONG (Sapu Jagat)
  // Pastikan semua state yang wajib (ada bintangnya) dicek di sini
  if (
    !fullName || 
    !email || 
    !phone || 
    !roleName || 
    !department || 
    !status || 
    !selectedDate // Joined At (DatePicker biasanya null kalau kosong)
  ) {
    // Pesan Error Singkat & Jelas
    toast.error("Please fill in all required fields marked with (*)");
    return; // Stop, jangan lanjut
  }

    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Invalid email format. Please check your input."); 
      return; 
    }

    try {
      setLoading(true);
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          roleName: roleName.toUpperCase(), 
          department,
          managerId: managerId || null, 
          roleTitle,
          bio: desc, 
          skills: skills,
          password: "password123", 
          status,           
          location,         
          joinedAt: selectedDate, 
        }),
      });

    const result = await res.json();
      if (res.ok) {
        toast.success("Team member successfully added");
        onClose();
        // Reset Form
        setFullName(""); setEmail(""); setPhone(""); setRoleName(""); setDepartment(""); setDesc("");
      } else {
        toast.error(result.message || "Failed to add team member");
      }
    } catch (error) {
      toast.error("Connection error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ==== SKILLS STATE ====
  const [skills, setSkills] = useState([
    "Wireframing",
  ]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() !== "" && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* === MODAL WRAPPER === */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-5 w-full max-w-xl relative max-h-[95vh] overflow-y-auto no-scrollbar">

        {/* === HEADER === */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#5A4FB5]  dark:bg-white p-2 rounded-full flex items-center justify-center">
            <UserRound className="text-white dark:text-black w-4 h-4" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Team</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* === FORM === */}
        <form
        noValidate 
          onSubmit={(e) => {
            e.preventDefault(); // Mencegah reload halaman
            handleSubmit();     // Panggil fungsi submit Anda
          }}
        >
        <div className="flex flex-col gap-2">
          {/* FULL NAME */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name*</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Input Your Full Name Here"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          {/* EMAIL + PHONE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail*</label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Input Your E-mail Here"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Phone*</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Input Your Phone Number Here"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
            </div>
          </div>

          {/* ROLE + DEPARTMENT + JOB TITLE */}
          <div className="grid grid-cols-3 gap-3">
            
            {/* 1. ROLE (System Role) */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Role*</label>
              <div className="relative">
                <select 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SALES">Sales</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* 2. DEPARTMENT */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Department*</label>
              <div className="relative">
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="">Select Dept</option>
                  <option>Sales</option>
                  <option>Marketing</option>
                  <option>Product</option>
                  <option>Support</option>
                  <option>Developer</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* 3. ROLE TITLE (Job Title) */}
            <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Job Title</label>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Sales"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
                />
             </div>
          </div>

          {/* STATUS + JOINED AT + LOCATION */}
          <div className="grid grid-cols-3 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Status*</label>
              <div className="relative">
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  // Tambahkan pr-8 di sini
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
                {/* Icon ChevronDown untuk Status */}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* Joined At */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Joined At*</label>
              <div className="relative">
                <Calendar 
                  size={16} 
                  // 👇 Tambahkan 'z-10' di sini
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 pointer-events-none z-10"
                />
                
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  placeholderText="Select Date"
                  dateFormat="yyyy-MM-dd"
                  className="w-full pl-10 pr-3 py-1 border text-sm border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
                  wrapperClassName="w-full"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Input Location"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
            </div>
          </div>

          {/* BIO */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                maxLength={100}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Input Bio"
                className="w-full h-15 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
              />

            {/* CHAR COUNT */}
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {desc.length}/100
            </div>
          </div>

          {/* SKILLS – UPDATED */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-900 mb-1 -mt-3">Skills</label>
            <div className="border border-gray-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-black bg-white min-h-[46px] flex flex-wrap gap-2 items-center">
              {skills.map((skill) => (
                <span key={skill} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500"><X size={12}/></button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder={skills.length === 0 ? "Input Your Skills Here" : ""}
                className="flex-1 outline-none text-sm bg-transparent min-w-[100px]"
              />
            </div>
          </div>

          {/* Reports To */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-900 mb-1.5">Reports to</label>
            <div className="relative">
              <select 
                value={roleTitle} 
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-4 pr-8 py-2.5 text-sm text-gray-600 focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer bg-white"
              >
                <option value="">Select Manager</option>
                
                {/* MAPPING DATA */}
                {managers.map((m) => (
                  <option key={m.id} value={m.id}> {/* 🔥 VALUE ADALAH ID */}
                    {m.fullName}
                  </option>
                ))}

              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
            </div>
          </div>

        </div>

        {/* SUBMIT BUTTON — centered + fit-content */}
        <div className="flex justify-center mt-3">
          <button 
            type="submit"
            disabled={loading}
            className="px-5 bg-[#5A4FB5] text-white text-[14.5px] py-2 rounded-full hover:bg-[#493e9b] transition"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
