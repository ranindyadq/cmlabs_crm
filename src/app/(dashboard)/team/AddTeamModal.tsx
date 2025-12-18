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
    if (!fullName || !email || !roleName) {
      toast.error("Nama, Email, dan Role wajib diisi");
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
          skills: skills.join(", "), 
          password: "password123", 
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
    "Prototyping",
    "Figma",
    "Design System",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* === MODAL WRAPPER === */}
      <div className="bg-white rounded-2xl shadow-lg p-4 relative animate-fadeIn w-[560px] max-h-[90vh] overflow-y-hidden">
        
        {/* === CLOSE BUTTON === */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        {/* === HEADER === */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#5A4FB5] p-3 rounded-full flex items-center justify-center">
            <UserRound className="text-white w-5 h-5" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-[#2E2E2E]">Add Team</h2>
        </div>

        {/* === FORM === */}
        <div className="flex flex-col gap-2 text-[13px]">
          {/* FULL NAME */}
          <div>
            <label className="block font-medium mb-1">Full Name*</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Input Your Full Name Here"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>

          {/* EMAIL + PHONE */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-medium mb-1">E-mail*</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Input Your E-mail Here"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Phone*</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Input Your Phone Number Here"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />
            </div>
          </div>

          {/* ROLE + DEPARTMENT */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-medium mb-1">Role*</label>
              <select 
              value={roleName} 
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]">
                <option value="">Select Role</option>
                <option value="ADMIN">Admin</option>
                <option value="SALES">Sales</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block font-medium mb-1">Department*</label>
              <select 
              value={department} // === TAMBAHKAN INI ===
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]">
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
          <div className="flex gap-2">
            {/* Status */}
            <div className="flex-1">
              <label className="block font-medium mb-1">Status*</label>
              <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]">
                <option value="">Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            {/* Joined At */}
            <div className="flex-1">
              <label className="block font-medium mb-1">Joined At*</label>
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
                  className="w-full pl-9 border border-gray-300 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                  wrapperClassName="w-full"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
              </div>
            </div>

            {/* Location */}
            <div className="flex-1">
              <label className="block font-medium mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Input Location"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />
            </div>
          </div>

          {/* BIO */}
          <div>
            <label className="block font-medium mb-1">Bio</label>

            <div className="border border-gray-300 rounded-lg relative">
              <textarea
                maxLength={100}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Input Bio"
                className="w-full px-3 py-1.5 text-[13px] h-20 resize-none focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />

              {/* TOOLBAR */}
              <div className="absolute bottom-1 left-2 flex items-center gap-1.5 text-gray-600 bg-white/70 px-1 py-0.5 rounded-md">
                <ListOrdered size={14} />
                <List size={14} />
                <div className="w-px h-3 bg-gray-300 mx-1" />
                <Bold size={14} />
                <Italic size={14} />
                <Underline size={14} />
                <Strikethrough size={14} />
                <div className="w-px h-3 bg-gray-300 mx-1" />
                <Ellipsis size={14} />
                <AtSign size={14} />
                <Link2 size={14} />
              </div>
            </div>

            {/* CHAR COUNT */}
            <div className="text-right text-xs text-gray-400 mt-1">
              {desc.length}/100
            </div>
          </div>

          {/* SKILLS – UPDATED */}
          <div className="mt-1">
            <label className="block font-medium mb-1">Skills</label>

            <div className="flex flex-wrap gap-2 mt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer"
                  onClick={() => removeSkill(skill)}
                >
                  {skill} ✕
                </span>
              ))}

              {/* INPUT TAG */}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add skill..."
                className="px-3 py-1 text-xs border border-gray-300 rounded-full focus:outline-none w-28"
              />
            </div>
          </div>

          {/* REPORTS TO — unchanged */}
          <div>
            <label className="block font-medium mb-1">Reports To</label>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Sales"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON — centered + fit-content */}
        <div className="flex justify-center mt-5">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 bg-[#5A4FB5] text-white text-[14.5px] py-2 rounded-full hover:bg-[#493e9b] transition"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
