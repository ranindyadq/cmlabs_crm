"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

import {
  Phone,
  MapPin,
  FileText,
  BriefcaseBusiness,
  User,
  Calendar,
  Users,
  FileCheck,
  Save,
  Loader2,
  Briefcase,
  Rocket,
  Pause,
  Circle,
  AlertCircle
} from "lucide-react";

// --- INTERFACES ---
interface WorkInfo {
  location?: string;
  bio?: string;
  skills?: string[];
  department?: string;
  joinedAt?: string | Date;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string | { id: string; name: string };
  status?: string;
  createdAt?: string | Date;
  managerId?: string;
  manager?: { id: string; fullName: string }; 
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
  department: string;
  role: string;
  status: string;
  managerId: string;
  joinedDate: Date | null;
}

interface ManagerOption {
  id: string;
  fullName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { 
    label: "Active", 
    color: "#137337", 
    icon: (props: any) => <Circle {...props} size={8} fill="currentColor" strokeWidth={0} /> 
  },
  inactive: { label: "Inactive", color: "#DC2626", icon: Pause },
  onboarding: { label: "Onboarding", color: "#2563EB", icon: Rocket },
  onleave: { label: "On Leave", color: "#D97706", icon: Briefcase },
  "on leave": { label: "On Leave", color: "#D97706", icon: Briefcase },
};

function hexWithAlpha(hex: string, alphaHex = "1A") {
  if (!hex) return "transparent";
  if (hex.length === 7) return `${hex}${alphaHex}`;
  return hex;
}

export default function ProfileTab({ initialData, onUpdateSuccess }: ProfileTabProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. STATE UNTUK DATA FORM ---
  const [formData, setFormData] = useState<ProfileFormState>({
    fullName: "",
    email: "",      
    phone: "",
    location: "",
    bio: "",
    department: "", 
    role: "",       
    status: "", 
    managerId: "",  
    joinedDate: null 
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savePopup, setSavePopup] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<ManagerOption[]>([]);

  // --- 1. LOAD DATA PROFILE & MANAGER LIST ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        let user: UserData;
        if (initialData) {
            user = initialData;
        } else {
            const res = await apiClient.get("/profile");
            user = res.data.data;
        }

        // Mapping State
        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          location: user.workInfo?.location || "",
          bio: user.workInfo?.bio || "",
          department: user.workInfo?.department || "", 
          
          // Finding C: Role System Only
          role: typeof user.role === 'object' && user.role !== null 
            ? (user.role as any).name 
            : (user.role || ""),
          
          status: user.status || "Active",
          
          // Finding A: Load managerId dari root user (bukan workInfo)
          managerId: user.managerId || user.manager?.id || "",
          
          // Finding B: Prioritaskan joinedAt workInfo
          joinedDate: user.workInfo?.joinedAt ? new Date(user.workInfo.joinedAt) : null, 
        });

        // Parse Skills
        const rawSkills = user.workInfo?.skills;
        if (Array.isArray(rawSkills)) {
          setSkills(rawSkills);
        } else if (typeof rawSkills === "string") {
          setSkills((rawSkills as string).split(",").map(s => s.trim()).filter(s => s !== ""));
        } else {
          setSkills([]);
        }

        // --- FETCH LIST MANAGER (Untuk Dropdown) ---
        // Kita butuh list user lain untuk dijadikan atasan
        try {
           const usersRes = await apiClient.get("/users?status=ACTIVE"); 
           // Asumsi endpoint /users mengembalikan array user
           // Filter agar user tidak bisa memilih dirinya sendiri sebagai manager
           const options = usersRes.data.data
             .filter((u: any) => u.id !== user.id) 
             .map((u: any) => ({ id: u.id, fullName: u.fullName }));
           setAvailableManagers(options);
        } catch (err) {
           console.warn("Gagal load list manager, dropdown mungkin kosong.");
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
        // Root User Data
        fullName: formData.fullName,
        phone: formData.phone,
        managerId: formData.managerId === "" ? null : formData.managerId, // Finding A: Kirim ID manager

        // Work Info Data
        workInfo: {
          department: formData.department,
          location: formData.location,
          bio: formData.bio,
          skills: skills, // Array String Native
          joinedAt: formData.joinedDate, // Finding B: Kirim Date Object
        }
    };

    try {
      // Pastikan endpoint benar ('/profile' atau '/api/profile' tergantung config axios kamu)
      // Jika pakai apiClient (axios), tidak perlu await res.json()
      await apiClient.patch("/profile", payload); 

      // 2. Update LocalStorage (Agar Header langsung berubah nama)
      const oldUserLocal = localStorage.getItem("user");
      if (oldUserLocal) {
          const parsedUser = JSON.parse(oldUserLocal);
          
          const updatedUser = {
              ...parsedUser,
              name: formData.fullName,     // Update nama untuk Layout
              fullName: formData.fullName, // Update nama untuk Profile
              phone: formData.phone
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // 3. Trigger Event agar Layout.tsx tahu ada perubahan
      window.dispatchEvent(new Event("user-updated"));

      // ============================================================

      setSavePopup(true);
      setTimeout(() => setSavePopup(false), 2000);

      onUpdateSuccess(); 
      // toast.success("Profile berhasil diperbarui!"); // Opsional, karena sudah ada popup
      
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "System error occurred";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

    // LOGIC STATUS RENDER
  const statusKey = formData.status?.toLowerCase() || "active";
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon || AlertCircle;

  return (
    <div className="w-full">
      
      {/* LAYOUT UTAMA: GRID 2 KOLOM TERPISAH
         Ini kuncinya. Kita buat 2 kolom besar yang berdiri sendiri.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 items-start">
        
        {/* =========================================================
            KOLOM KIRI: BASIC INFORMATION (Fullname, Email, Phone, Loc, Bio)
           ========================================================= */}
        <div className="flex flex-col gap-2">
            
            {/* Header Kiri */}
            <div className="flex items-center gap-2">
               <User className="text-gray-700 w-5 h-5" />
               <h3 className="font-semibold text-gray-800 text-[16px]">Basic Information</h3>
            </div>

            {/* Input 1: Fullname */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Fullname</label>
               <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5]"
                  />
               </div>
            </div>

            {/* Input 2: Email */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
               <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
                  />
               </div>
            </div>

            {/* Input 3: Phone Number */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
               <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5]"
                  />
               </div>
            </div>

            {/* Input 4: Location */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Location</label>
               <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5]"
                  />
               </div>
            </div>

            {/* Input 5: Bio (Sekarang ada di kolom kiri, di paling bawah) */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio</label>
               <textarea
                 maxLength={100}
                 name="bio"
                 value={formData.bio}
                 onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                 className="border border-gray-300 rounded-lg w-full h-32 px-3 py-2 text-sm focus:ring-2 focus:ring-[#5A4FB5] resize-none"
               />
               <div className="text-right text-xs text-gray-400 mt-1">
                 {formData.bio.length}/100
               </div>
            </div>

        </div>


        {/* =========================================================
            KOLOM KANAN: WORK INFORMATION (Dept, Role, Status, Date, Report, Skills)
           ========================================================= */}
        <div className="flex flex-col gap-2 h-full relative">
            
            {/* Header Kanan */}
            <div className="flex items-center gap-2"> {/* Tanpa border bawah agar lebih bersih, atau tambahkan jika mau */}
               <BriefcaseBusiness className="text-gray-700 w-5 h-5" />
               <h3 className="font-semibold text-gray-800 text-[16px]">Work Information</h3>
            </div>

            {/* Input 1: Department */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Departemen</label>
               <div className="relative">
                 <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                 <input
                   name="department"
                   value={formData.department}
                   onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                   className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5]"
                 />
               </div>
            </div>

            {/* Input 2: Role */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Role</label>
               <div className="relative">
                 <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                 <input
                   name="role"
                   value={formData.role}
                   disabled
                   className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
                 />
               </div>
            </div>

            {/* Input 3: Status */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
               <div className="relative">
                 <span 
                    className="absolute left-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-semibold z-10 flex items-center gap-1.5"
                    style={{
                        backgroundColor: hexWithAlpha(statusConfig.color, "1A"), // Opacity 10%
                        color: statusConfig.color
                    }}
                 >
                   <StatusIcon size={12} strokeWidth={2.5} />
                   {statusConfig.label || formData.status}
                 </span>
                 <input
                   disabled
                   // Tambah padding-left (pl) lebih besar agar teks input tidak menabrak badge
                   className="w-full border border-gray-300 bg-gray-50 rounded-lg py-2.5 pl-32 pr-3 text-sm cursor-not-allowed text-transparent" // text-transparent agar value teks asli tidak dobel
                   value={formData.status} // Tetap perlu value agar form controlled
                 />
               </div>
            </div>

            {/* Input 4: Joined Date */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Joined Date</label>
               <div className="relative">
                 <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                 <DatePicker
                   selected={formData.joinedDate}
                   disabled
                   dateFormat="yyyy-MM-dd"
                   className="w-full border border-gray-300 bg-gray-50 text-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm cursor-not-allowed"
                   wrapperClassName="w-full"
                 />
               </div>
            </div>

            {/* Input 5: Reports To */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Reports To (Manager)</label>
               <div className="relative">
                 <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <select
                   name="managerId"
                   value={formData.managerId}
                   onChange={handleChange}
                   className="w-full border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] bg-white appearance-none"
                 >
                   <option value="">No Manager</option>
                   {availableManagers.map((m) => (
                     <option key={m.id} value={m.id}>
                       {m.fullName}
                     </option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Input 6: Skills */}
            <div>
               <label className="text-sm font-medium text-gray-700 block mb-1.5">Skills & Expertise</label>
               <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-2 min-h-[42px]">
                 {skills.map((skill) => (
                   <span key={skill} onClick={() => removeSkill(skill)} className="px-3 py-1 bg-gray-200 rounded-md text-xs cursor-pointer hover:bg-gray-300 flex items-center gap-1">
                     {skill} <span className="text-gray-500">✕</span>
                   </span>
                 ))}
                 <input
                   value={skillInput}
                   onChange={(e) => setSkillInput(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                   className="flex-1 min-w-[100px] text-xs focus:outline-none bg-transparent"
                   placeholder="Type & enter..."
                 />
               </div>
            </div>

            {/* SAVE BUTTON (Posisikan di akhir kolom kanan) */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-[#5A4FB5] hover:bg-gray-900 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} className="text-white" />
                Save Changes
                </button>
            </div>

        </div>

      </div>

      {/* SAVE POPUP (Tetap di luar grid, sama seperti sebelumnya) */}
      {savePopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <FileCheck size={32} color="white" />
            </div>
            <h3 className="text-lg font-semibold">Profile Updated</h3>
            <p className="text-sm text-gray-600 mt-1">Profile information has been saved successfully.</p>
          </div>
        </div>
      )}
    </div>
);
}