"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

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

interface WorkInfo {
  location?: string;
  bio?: string;
  skills?: string[] | string; // Bisa array atau string dari DB
  department?: string;
  reportsTo?: string;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: string | Date;
  workInfo?: WorkInfo;
}

interface ProfileTabProps {
  initialData: UserData | null;
  onUpdateSuccess: () => void;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  skills: string;
  department: string;
  role: string;
  status: string;
  reportsTo: string;
  joinedDate: Date | null;
}

export default function ProfileTab({ initialData, onUpdateSuccess }: ProfileTabProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. STATE UNTUK DATA FORM ---
  const [formData, setFormData] = useState<ProfileFormState>({
    fullName: "",
    email: "",      // Tambahan
    phone: "",
    location: "",
    bio: "",
    skills: "", 
    department: "", // Tambahan
    role: "",       // Tambahan
    status: "", // Tambahan
    reportsTo: "",  // Tambahan
    joinedDate: null // Tambahan
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savePopup, setSavePopup] = useState(false);

  // --- FETCH DATA ---
  // Kita gabungkan logic: Jika ada initialData pakai itu, jika tidak fetch sendiri (opsional)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        let user: UserData;

        // Jika initialData dari props ada, gunakan itu. Jika tidak, fetch API.
        if (initialData) {
            user = initialData;
        } else {
            const res = await apiClient.get("/profile");
            user = res.data.data;
        }

        // Mapping data ke Form State
        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.workInfo?.location || "",
          bio: user.workInfo?.bio || "",
          department: user.workInfo?.department || "", 
          role: typeof user.role === 'object' && user.role !== null 
            ? (user.role as any).name 
            : (user.role || ""),
          status: user.status || "Active",
          reportsTo: user.workInfo?.reportsTo || "",
          joinedDate: user.createdAt ? new Date(user.createdAt) : null,
          skills: Array.isArray(user.workInfo?.skills) ? user.workInfo!.skills.join(", ") : (user.workInfo?.skills as string) || ""
        });

        // Parsing skills untuk UI Tags
        const rawSkills = user.workInfo?.skills;
        if (typeof rawSkills === "string") {
          setSkills(rawSkills.split(",").map((s: string) => s.trim()).filter(s => s !== ""));
        } else if (Array.isArray(rawSkills)) {
          setSkills(rawSkills);
        } else {
          setSkills([]);
        }

      } catch (error) {
        console.error("Gagal load profil:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initialData]);

  // --- 3. LOGIKA SAVE KE BACKEND ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Siapkan payload (gabungkan skills array jadi string untuk dikirim ke API jika API butuh string)
    // Atau kirim form data apa adanya sesuai kebutuhan backend
    const payload = {
        // 1. Data untuk tabel User (Root)
      fullName: formData.fullName,
      phone: formData.phone,
      
      // 2. Data untuk tabel WorkInfo (Nested)
      workInfo: {
        department: formData.department, // Masukkan department disini
        location: formData.location,
        bio: formData.bio,
        reportsTo: formData.reportsTo,
        skills: skills.join(", "), // Skills juga masuk sini
        }
    };

    try {
      // Pastikan endpoint benar ('/profile' atau '/api/profile' tergantung config axios kamu)
      // Jika pakai apiClient (axios), tidak perlu await res.json()
      await apiClient.patch("/profile", payload); 

      // Tampilkan Popup Sukses custom kamu
      setSavePopup(true);
      setTimeout(() => setSavePopup(false), 2000);

      onUpdateSuccess(); 
      toast.success("Profile berhasil diperbarui!"); 
      
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Terjadi kesalahan sistem";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // @ts-ignore (Kadang TS rewel soal key dynamic, ini aman)
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-[#5A4FB5]" />
      </div>
    );

  return (
    <div className="w-full">
      {/* Header Sections */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Basic Information Header */}
        <div className="flex items-center gap-2">
          <User className="text-gray-700 w-5 h-5" />
          <h3 className="font-semibold text-gray-800 text-base">
            Basic Information
          </h3>
        </div>

        {/* Work Information Header */}
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="text-gray-700 w-5 h-5" />
          <h3 className="font-semibold text-gray-800 text-base">
            Work Information
          </h3>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* LEFT COLUMN - BASIC INFORMATION */}
        
        {/* Fullname */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Fullname
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder=""
              className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Department */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Departemen
          </label>
          <div className="relative">
            <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              name="department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder=""
              className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Email
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder=""
              disabled
              className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Role
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              name="role"
              value={formData.role}
              placeholder=""
              disabled
              className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder=""
              className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Status
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-gray-800 text-white text-xs rounded-md z-10">
              {formData.status}
            </span>
            <input
              value=""
              placeholder=""
              disabled
              className="w-full border border-gray-300 bg-gray-50 rounded-lg py-2.5 pl-20 pr-3 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Location
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder=""
              className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* Joined Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Joined Date
          </label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <DatePicker
              selected={formData.joinedDate}
              onChange={(date) =>
                setFormData({ ...formData, joinedDate: date })
              }
              placeholderText=""
              dateFormat="yyyy-MM-dd"
              disabled
              className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
              wrapperClassName="w-full"
            />
          </div>
        </div>

        {/* Bio - spans full width */}
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Bio
          </label>
          <textarea
            maxLength={100}
            name="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder=""
            className="border border-gray-300 rounded-lg w-full h-24 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {formData.bio.length}/100
          </div>
        </div>

        {/* Reports To - left side, bottom */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Reports To
          </label>
          <div className="relative">
            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="reportsTo"
              value={formData.reportsTo}
              onChange={(e) =>
                setFormData({ ...formData, reportsTo: e.target.value })
              }
              placeholder=""
              className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
            />
          </div>
        </div>

        {/* Skills & Expertise - right side, bottom */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Skills & Expertise
          </label>
          <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-2 min-h-[42px]">
            {skills.map((skill) => (
              <span
                key={skill}
                onClick={() => removeSkill(skill)}
                className="px-3 py-1 bg-gray-200 rounded-md text-xs cursor-pointer hover:bg-gray-300 transition-colors flex items-center gap-1"
              >
                {skill} <span className="text-gray-500">✕</span>
              </span>
            ))}

            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSkill())
              }
              placeholder=""
              className="flex-1 min-w-[100px] text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SAVE CHANGES BUTTON */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSubmitting ? "Saving..." : "Save Changes"}
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
            <p className="text-sm text-gray-600 mt-1">
              Changes have been updated
            </p>
          </div>
        </div>
      )}
    </div>
  );
}