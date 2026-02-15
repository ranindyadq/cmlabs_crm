"use client";

import React, { useState, useEffect } from "react";
import { 
  Building, Save, Loader2, FileCheck, Globe, Mail, 
  Phone, MapPin, Camera, Image as ImageIcon 
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";
import Image from "next/image";

interface InputGroupProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}

export default function OrganizationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savePopup, setSavePopup] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    country: "",
    email: "",
    phone: "",
    website: "",
    logoUrl: ""
  });

  // 1. FETCH DATA SAAT MOUNT
  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await apiClient.get("/organization");
        if (res.data.data) {
          setFormData(res.data.data);
        }
      } catch (err) {
        console.error("Gagal load data organisasi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  // 2. HANDLE UPLOAD LOGO
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Logo size too large. Max 2MB.");
    }

    const uploadData = new FormData();
    uploadData.append("file", file); 

    try {
      setUploading(true);
      
      // === PERBAIKAN DI SINI ===
      // Tambahkan headers agar backend tahu ini adalah file upload
      const res = await apiClient.post("/organization/logo", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // =========================

      setFormData({ ...formData, logoUrl: res.data.photoUrl });
      toast.success("Logo uploaded!");
    } catch (err) {
      console.error(err); // Agar error terlihat di console browser
      toast.error("Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  };

  // 3. HANDLE SAVE DATA
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post("/organization", formData);
      setSavePopup(true);
      setTimeout(() => setSavePopup(false), 2000);
      
      // Memberitahu komponen lain (Sidebar) bahwa data mungkin berubah
      window.dispatchEvent(new Event("storage")); 
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Building className="w-5 h-5 text-gray-700" />
          <h2 className="text-[16px] font-semibold text-gray-800">Organization Settings</h2>
        </div>
          <p className="text-[12px] text-gray-500">Update company identity and invoice branding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COL: BRANDING */}
        <div className="space-y-8">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">Company Logo</label>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {formData.logoUrl ? (
                  <Image 
                    src={formData.logoUrl} 
                    alt="Logo" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 150px"
                    className="object-contain p-2" 
                  />
                ) : (
                  <ImageIcon className="text-gray-300" size={32} />
                )}
                {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={20} /></div>}
              </div>
              
              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                <Camera size={16} />
                Change Logo
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <InputGroup label="Company Name" icon={<Building size={16}/>} value={formData.companyName} 
              onChange={(v) => setFormData({...formData, companyName: v})} />

            <InputGroup 
              label="Tagline / Slogan" 
              icon={<FileCheck size={16}/>} // Icon bebas
              value={formData.tagline} 
              onChange={(v) => setFormData({...formData, tagline: v})} 
            />
            
            <InputGroup label="Official Email" icon={<Mail size={16}/>} value={formData.email} 
              onChange={(v) => setFormData({...formData, email: v})} />
            
            <InputGroup label="Phone Number" icon={<Phone size={16}/>} value={formData.phone} 
              onChange={(v) => setFormData({...formData, phone: v})} />
            
            <InputGroup label="Website" icon={<Globe size={16}/>} value={formData.website} 
              onChange={(v) => setFormData({...formData, website: v})} />
          </div>
        </div>

        {/* RIGHT COL: ADDRESS */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700 block">Company Address (For Invoices)</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            <textarea 
              placeholder="Address Line 1"
              className="w-full border rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none min-h-[80px]"
              value={formData.addressLine1}
              onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
            />
          </div>
          
          <input placeholder="Address Line 2 (Optional)" className="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
            value={formData.addressLine2} onChange={(e) => setFormData({...formData, addressLine2: e.target.value})} />

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" className="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
              value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            <input placeholder="Province" className="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
              value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} />
          </div>
          <input placeholder="Country" className="w-full border rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
            value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
        </div>
      </div>

      <div className="flex justify-end mt-12">
        <button 
          onClick={handleSave} 
          disabled={saving || uploading}
          className="px-8 py-2.5 rounded-full bg-[#5A4FB5] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#4a4194] transition-all shadow-md disabled:opacity-50"
        >
          <Save size={16} className="text-white" />
          Save Changes
        </button>
      </div>

      {savePopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[320px] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <FileCheck size={32} color="white" />
            </div>
            <h3 className="text-lg font-semibold">Organization Updated</h3>
            <p className="text-sm text-gray-600 mt-1">Organization information has been saved successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Mini Component
function InputGroup({ label, icon, value, onChange }: InputGroupProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative mt-1">
        <div className="absolute left-3 top-2.5 text-gray-400">{icon}</div>
        <input 
          className="w-full border rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-[#5A4FB5] outline-none"
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
      </div>
    </div>
  );
}