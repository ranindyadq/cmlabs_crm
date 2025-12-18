"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Save, MapPin, Mail, Phone, Globe, Lock } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State sesuai model Anda
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    country: "",
  });

  // Fetch Data Saat Load
  // ============================================================
  // 1. USE EFFECT PERTAMA: Cek Autentikasi & Role
  // ============================================================
  // 1. CEK ROLE (Tanpa Redirect Paksa)
  useEffect(() => {
    // 1. Ambil "token" (sesuai data yang Anda miliki)
    const token = localStorage.getItem("token"); 
    
    if (token) {
        // --- MODE TESTING UI ---
        // Karena di localStorage hanya ada token (string acak) dan tidak ada info Role,
        // kita anggap siapa saja yang punya token adalah ADMIN agar bisa melihat halaman ini.
        console.log("Token ditemukan, memberikan akses Admin untuk testing.");
        
        setIsAdmin(true); // Izinkan akses
        fetchData();      // Ambil data form
    } else {
        // Jika benar-benar tidak ada token, baru tendang ke login
        router.push("/auth/signin"); 
    }
  }, [router]);

  // Fungsi Fetch Data (Dipanggil hanya jika Admin)
  const fetchData = async () => {
    try {
      const res = await apiClient.get("/organization");
      const data = res.data.data;
      if (data) {
        setFormData({
          companyName: data.companyName || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          province: data.province || "",
          country: data.country || "",
        });
      }
    } catch (error) {
      console.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/organization", formData);
      toast.success("Company profile updated!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // ============================================================
  // TAMPILAN KHUSUS BUKAN ADMIN (KOSONG / RESTRICTED)
  // ============================================================
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Lock size={48} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-700">Access Restricted</h1>
        <p className="text-gray-500 mt-2 max-w-md">
          You do not have permission to view or edit Company Settings. 
          Please contact your Administrator if you need to make changes.
        </p>
      </div>
    );
  }

  // ============================================================
  // TAMPILAN KHUSUS ADMIN (FORM LENGKAP)
  // ============================================================
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#2E2E2E] mb-6">Company Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Identitas Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5A4FB5] focus:outline-none"
                />
              </div>
            </div>
            {/* ... (Input lainnya sama seperti sebelumnya) ... */}
            <div>
               <label className="block text-sm font-medium mb-1">Email</label>
               <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            </div>
             <div>
               <label className="block text-sm font-medium mb-1">Phone</label>
               <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            </div>
             <div>
               <label className="block text-sm font-medium mb-1">Website</label>
               <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Alamat Detail */}
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MapPin size={18} /> Address Details
          </h3>
          
          <div className="space-y-4">
            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Address Line 1" className="w-full px-4 py-2 border rounded-lg" />
            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Address Line 2" className="w-full px-4 py-2 border rounded-lg" />
            
            <div className="grid grid-cols-3 gap-4">
               <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full px-4 py-2 border rounded-lg" />
               <input type="text" name="province" value={formData.province} onChange={handleChange} placeholder="Province" className="w-full px-4 py-2 border rounded-lg" />
               <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#5A4FB5] text-white px-6 py-2 rounded-full font-medium hover:bg-[#4B42A8] transition-all disabled:opacity-70"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}