"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  UserRound,
  ListOrdered,
  List,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Ellipsis,
  AtSign,
  Link2,
  Calendar,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [status, setStatus] = useState("ACTIVE");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState(""); 
  const [loading, setLoading] = useState(false);

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
        toast.success("Anggota tim berhasil ditambahkan");
        onClose();
        // Reset Form
        setFullName(""); setEmail(""); setPhone(""); setRoleName(""); setDepartment(""); setDesc("");
      } else {
        toast.error(result.message || "Gagal menambah tim");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
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
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-5 w-full max-w-xl relative max-h-[95vh] overflow-y-auto">

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

          {/* ROLE + DEPARTMENT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Role*</label>
              <select 
              value={roleName} 
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
              >
                <option value="">Select Role</option>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Sales</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Department*</label>
              <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer">
                <option value="">Select Department</option>
                <option>Sales</option>
                <option>Marketing</option>
                <option>Product</option>
                <option>Support</option>
                <option>Developer</option>
              </select>
            </div>
          </div>

          {/* STATUS + JOINED AT + LOCATION */}
          <div className="grid grid-cols-3 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Status*</label>
              <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
              >
                <option value="">Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            {/* Joined At */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Joined At*</label>
              <div className="relative">
                <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
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
              <label className="block text-xs font-medium mb-1 -mt-3 text-gray-700 dark:text-gray-300">Skills</label>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Input Your Skills Here"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
              
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-pointer transition-colors flex items-center gap-1.5"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill}
                      <X size={14} className="text-gray-500" />
                    </span>
                  ))}
                </div>
              )}
            </div>

          {/* REPORTS TO — unchanged */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Reports To</label>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Sales"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
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
