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
  roleTitle: string;
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
  const router = useRouter();

  // === STATE ===
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Manager State
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<{ id: string, fullName: string }[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // 1. Fetch Manager List saat modal dibuka
  useEffect(() => {
    if (openEdit) {
        fetch("/api/team?limit=100")
            .then(res => res.json())
            .then(json => setManagers(json.data || []));
    }
  }, [openEdit]);

  // 2. Sync State dengan Data Member (Prefill)
  useEffect(() => {
    setFullName(member.name || "");
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setRole(member.role || "");         // System Role (ADMIN/SALES)
    setRoleTitle(member.roleTitle || ""); // Job Title (Manager/Staff)
    setDept(member.dept || "");
    setStatus(member.status || "");
    setLocation(member.location || "");
    setDesc(member.bio || "");
    setSkills(member.skills || []);
    setManagerId(member.reportsTo || ""); // Set ID manager

    if (member.joined) {
      const d = new Date(member.joined);
      setSelectedDate(isNaN(d.getTime()) ? null : d);
    } else {
      setSelectedDate(null);
    }
  }, [member, openEdit]);

  // Handlers
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
          status: status.toUpperCase(),
          roleName: role.toUpperCase(), // Backend butuh roleName
          roleTitle: roleTitle,         // Backend butuh roleTitle
          managerId: managerId || null,
          department: dept,
          bio: desc,
          location,
          skills,
          joinedAt: selectedDate,
        }),
      });

      if (res.ok) {
        toast.success("Data successfully updated");
        onCloseEdit(); // Ini akan memicu fetchTeam di parent
        router.refresh();
      } else {
        toast.error("Failed to update data");
      }
    } catch (error) {
      toast.error("System error occurred");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Team member successfully deleted");
        onCloseDelete();
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete data");
    }
  };

  // === EDIT MODAL UI ===
  const EditModal = openEdit ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-5 w-full max-w-xl relative max-h-[95vh] overflow-y-auto no-scrollbar">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#5A4FB5] dark:bg-white p-2 rounded-full flex items-center justify-center">
            <UserRound className="text-white dark:text-black w-4 h-4" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Team</h2>
          <button
            onClick={onCloseEdit}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl w-8 h-8 flex items-center justify-center"
          >
            <X />
          </button>
        </div>

        {/* FORM */}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(); // 🔥 FIX: Panggil handleSave langsung
          }}
        >
          <div className="flex flex-col gap-2">
            
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name*</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />
            </div>

            {/* EMAIL + PHONE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">E-mail*</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Phone*</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>
            </div>

            {/* ROLE + DEPARTMENT + JOB TITLE */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Role*</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] appearance-none"
                  >
                    <option value="">Select Role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SALES">Sales</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Department*</label>
                <div className="relative">
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] appearance-none"
                  >
                    <option value="">Select Dept</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>Product</option>
                    <option>Support</option>
                    <option>Developer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Job Title</label>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior Sales"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>
            </div>

            {/* STATUS + JOINED + LOCATION */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Status*</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] appearance-none"
                  >
                    <option value="">Select Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Joined At*</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 pointer-events-none z-10" />
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full pl-10 pr-3 py-1 border text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
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
                className="w-full h-15 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] resize-none"
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {desc.length}/100
              </div>
            </div>

            {/* SKILLS */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-900 mb-1 -mt-3">Skills</label>
              <div className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white min-h-[46px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[#5A4FB5]">
                {skills.map((skill) => (
                  <span key={skill} className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add skill..."
                  className="flex-1 outline-none text-sm bg-transparent min-w-[100px]"
                />
              </div>
            </div>

            {/* REPORTS TO */}
            <div>
              <label className="block text-[13px] font-semibold text-gray-900 mb-1.5">Reports to</label>
              <div className="relative">
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-4 pr-8 py-2.5 text-sm text-gray-600 focus:ring-2 focus:ring-[#5A4FB5] outline-none appearance-none cursor-pointer bg-white"
                >
                  <option value="">No Manager</option>
                  {managers
                    .filter(m => m.id !== member.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

          </div>

          <div className="flex justify-center mt-5">
            <button
              type="submit"
              className="px-5 bg-[#5A4FB5] text-white text-[14.5px] py-2 rounded-full hover:bg-[#493e9b] transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const DeleteModal = openDelete ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-[320px] text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
          <Trash2 size={28} color="white" />
        </div>
        <h3 className="text-lg font-semibold">Delete Team?</h3>
        <p className="text-sm text-gray-600 mt-1">Press confirm if you are sure</p>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onCloseDelete} className="px-5 py-2 rounded-full bg-[#5A4FB5] text-white font-medium">Cancel</button>
          <button onClick={handleDelete} className="px-5 py-2 rounded-full bg-gray-300 text-[#2E2E2E] font-medium">Delete</button>
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