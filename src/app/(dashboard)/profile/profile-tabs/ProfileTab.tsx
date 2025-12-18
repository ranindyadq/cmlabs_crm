"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

import {
  Mail,
  Phone,
  MapPin,
  FileText,
  BriefcaseBusiness,
  User,
  Calendar,
  ChevronDown,
  Users,
  FileCheck,
  Save,
  Loader2,
} from "lucide-react";

export default function ProfileTab() {
  // --- 1. STATE UNTUK DATA FORM ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "", // Read-only
    phone: "",
    location: "",
    bio: "",
    department: "Sales",
    role: "", // Read-only
    status: "Active",
    reportsTo: "",
    joinedDate: null as Date | null,
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savePopup, setSavePopup] = useState(false);

  // --- 2. FETCH DATA SAAT MOUNT ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Endpoint /api/profile yang mengembalikan data user + userWorkInfo
        const res = await apiClient.get("/profile"); 
        const user = res.data.data;

        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.workInfo?.location || "",
          bio: user.workInfo?.bio || "",
          department: user.workInfo?.department || "Sales",
          role: user.role || "",
          status: user.status || "Active",
          reportsTo: user.workInfo?.reportsTo || "",
          joinedDate: user.createdAt ? new Date(user.createdAt) : null,
        });

        // Parsing skills dari string (DB) ke array (UI)
        if (user.workInfo?.skills) {
          setSkills(user.workInfo.skills.split(",").map((s: string) => s.trim()));
        }
      } catch (error) {
        console.error("Gagal load profil:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- 3. LOGIKA SAVE KE BACKEND ---
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        skills: skills.join(", "), // Gabung array jadi string untuk DB
      };

      await apiClient.patch("/profile", payload);

      setSavePopup(true);
      setTimeout(() => setSavePopup(false), 2000);
      toast.success("Profile updated!");
    } catch (error: any) {
      console.error("Gagal update profil:", error);
      const msg = error.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Helper change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Skill Handlers
  const addSkill = () => {
    if (skillInput.trim() !== "" && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#5A4FB5]" /></div>;

  return (
    <div className="w-full px-6 py-1">
      <div className="grid grid-cols-2 gap-8">

        {/* BASIC INFORMATION */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="text-gray-700 w-5 h-5" />
            <h3 className="font-semibold text-gray-700 text-[17px]">
              Basic Information
            </h3>
          </div>

          {/* Fullname */}
          <label className="text-sm font-medium">Fullname</label>
          <div className="relative mt-1 mb-3">
            <User size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              name="fullName" // Harus sama dengan key di state
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="Full Name"
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>

          {/* Email */}
          <label className="text-sm font-medium">Email</label>
          <div className="relative mt-1 mb-3">
            <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              placeholder="Your email address"
              name="email" // Harus sama dengan key di state
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled // <--- PENTING: Sesuai Requirement
              className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-lg py-2 pl-9 pr-3 text-sm cursor-not-allowed"
            />
          </div>

          {/* Phone Number */}
          <label className="text-sm font-medium">Phone Number</label>
          <div className="relative mt-1 mb-3">
            <Phone size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              name="phone" // Harus sama dengan key di state
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Your phone number"
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>

          {/* Location */}
          <label className="text-sm font-medium">Location</label>
          <div className="relative mt-1 mb-3">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              name="location" // Harus sama dengan key di state
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Your location"
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>

          {/* Bio */}
          <label className="text-sm font-medium">Bio</label>s
          <textarea
            maxLength={100}
            name="bio" // Harus sama dengan key di state
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="Your bio"
            className="border border-gray-300 rounded-lg w-full h-24 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
          />

          <div className="text-right text-xs text-gray-400 mt-1">
            {formData.bio.length}/100
          </div>
        </div>

        {/* WORK INFORMATION */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BriefcaseBusiness className="text-gray-700 w-5 h-5" />
            <h3 className="font-semibold text-gray-700 text-[17px]">
              Work Information
            </h3>
          </div>

          {/* Department */}
          <label className="text-sm font-medium">Department</label>
          <div className="relative mt-1 mb-3">
            <FileText size={16} className="absolute left-3 top-3 text-gray-500" />
            <select
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            >
              <option>Select Department</option>
              <option>Sales</option>
              <option>Marketing</option>
              <option>Product</option>
              <option>Support</option>
              <option>Developer</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>

          {/* Role - dropdown */}
         <label className="text-sm font-medium">Role</label>
          <div className="relative mt-1 mb-3">
            <User size={16} className="absolute left-3 top-3 text-gray-500" />
            <select
              disabled // <--- PENTING: User tidak boleh ganti role sendiri
              className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-lg py-2 pl-9 pr-8 text-sm appearance-none cursor-not-allowed"
            >
              <option>Sales</option> {/* Nanti ambil dari state */}
            </select>
          </div>

          {/* Status - dropdown */}
          <label className="text-sm font-medium">Status</label>
          <div className="relative mt-1 mb-3">
            <select
              className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Onboarding</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>

          {/* Joined Date */}
          <label className="text-sm font-medium">Joined Date</label>
          <div className="relative mt-1 mb-3">
            <Calendar className="absolute left-3 top-3 text-gray-500 w-4 h-4" />
            <DatePicker
              selected={formData.joinedDate}
              onChange={(date) => setFormData({ ...formData, joinedDate: date })}
              placeholderText="Select Date"
              dateFormat="yyyy-MM-dd"
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              wrapperClassName="w-full"
            />
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
          </div>

          {/* Reports To */}
          <label className="text-sm font-medium">Reports To</label>
          <div className="relative mt-1 mb-3">
            <Users size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              placeholder="..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>

          {/* Skills */}
          <label className="text-sm font-medium">Skills & Expertise</label>
          <div className="flex flex-wrap gap-2 mt-1 mb-4">
            {skills.map((skill) => (
              <span
                key={skill}
                onClick={() => removeSkill(skill)}
                className="px-3 py-1 bg-gray-100 rounded-full text-xs cursor-pointer"
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
      </div>

      {/* SAVE CHANGES BUTTON */}
      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-full bg-[#5A4FB5] text-white text-sm font-medium flex items-center gap-2"
        >
          <Save size={16} className="text-white" />
          Save Changes
        </button>
      </div>

      {/* SAVE CONFIRMATION POPUP */}
      {savePopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <FileCheck size={32} color="white" />
            </div>

            <h3 className="text-lg font-semibold">Saved</h3>
            <p className="text-sm text-gray-600 mt-1">Changes have been updated</p>
          </div>
        </div>
      )}
    </div>
  );
}
