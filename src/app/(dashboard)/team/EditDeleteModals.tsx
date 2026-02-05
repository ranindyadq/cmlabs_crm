"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

type Member = {
  id: string;
  name: string;
  role: string;
  dept: string;
  status: string;
  email: string;
  joined?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  phone?: string;
  reportsTo?: string;
};

type Props = {
  openEdit: boolean;
  openDelete: boolean;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  member: Member;
};

export default function EditDeleteModals({
  openEdit,
  openDelete,
  onCloseEdit,
  onCloseDelete,
  member,
}: Props) {
  // === EDIT STATE (prefill from member) ===
  const [fullName, setFullName] = useState(member.name || "");
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState(member.role || "");
  const [dept, setDept] = useState(member.dept || "");
  const [status, setStatus] = useState(member.status || "");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [location, setLocation] = useState(member.location || "");
  const [desc, setDesc] = useState(member.bio || "");
  const [skills, setSkills] = useState<string[]>(member.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [reportsTo, setReportsTo] = useState(member.reportsTo || "");
  const router = useRouter();

  useEffect(() => {
    // Prefill whenever member changes / modal opens
    setFullName(member.name || "");
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setRole(member.role || "");
    setDept(member.dept || "");
    setStatus(member.status || "");
    setLocation(member.location || "");
    setDesc(member.bio || "");
    setSkills(member.skills || []);
    setReportsTo(member.reportsTo || "");
    // parse joined date if exists
    if (member.joined) {
      const d = new Date(member.joined);
      setSelectedDate(isNaN(d.getTime()) ? null : d);
    } else {
      setSelectedDate(null);
    }
  }, [member, openEdit]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s !== "" && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          status: status.toUpperCase(), // Sinkronkan dengan Enum DB
          roleName: role.toUpperCase(),
          department: dept,
          roleTitle: role, // Sesuaikan dengan field workInfo
          bio: desc,
          location,
          skills,
          joinedAt: selectedDate,
        }),
      });

      if (res.ok) {
        toast.success("Data berhasil diperbarui");
        onCloseEdit();
        router.refresh(); // Refresh untuk melihat perubahan
      }
    } catch (error) {
      toast.error("Gagal memperbarui data");
    }
  };

  const handleDelete = async () => {
  try {
    const res = await fetch(`/api/team/${member.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Anggota tim berhasil dihapus");
      onCloseDelete();
      router.push("/team"); // Kembali ke daftar setelah hapus
    }
  } catch (error) {
    toast.error("Gagal menghapus data");
  }
};

  // === EDIT MODAL (identical structure to AddTeamModal, prefilled) ===
  const EditModal = openEdit ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* === MODAL WRAPPER === */}
      <div className="bg-white rounded-2xl shadow-lg p-4 relative animate-fadeIn w-[560px] max-h-[90vh] overflow-y-hidden">
        {/* CLOSE */}
        <button
          onClick={onCloseEdit}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          <X />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#5A4FB5] p-3 rounded-full flex items-center justify-center">
            <UserRound className="text-white w-5 h-5" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-[#2E2E2E]">Edit Team</h2>
        </div>

        {/* FORM */}
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
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              >
                <option value="">Select Role</option>
                <option value="ADMIN">Admin</option>  {/* Value harus UPPERCASE */}
                <option value="SALES">Sales</option>  {/* Agar cocok dengan logic backend */}
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block font-medium mb-1">Department*</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              >
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
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              >
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
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

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
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              placeholder="..."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON — centered + fit-content */}
        <div className="flex justify-center mt-5">
          <button
            onClick={handleSave}
            className="px-5 bg-[#5A4FB5] text-white text-[14.5px] py-2 rounded-full hover:bg-[#493e9b] transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // === DELETE MODAL (small) ===
  const DeleteModal = openDelete ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[320px] text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
          <Trash2 size={28} color="white" />
        </div>

        <h3 className="text-lg font-semibold">Delete Team?</h3>
        <p className="text-sm text-gray-600 mt-1">Press confirm if you are sure</p>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onCloseDelete}
            className="px-5 py-2 rounded-full bg-[#5A4FB5] text-white font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-5 py-2 rounded-full bg-gray-300 text-[#2E2E2E] font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {EditModal}
      {DeleteModal}
    </>
  );
}
