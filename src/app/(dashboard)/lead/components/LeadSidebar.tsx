"use client";

import { useState,useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Edit, Calendar, User, Phone, Mail, ChevronDown, X } from "lucide-react";

type LeadSidebarProps = {
  lead: any;
  onRefresh: () => void;
};

export function LeadSidebar({ lead, onRefresh }: LeadSidebarProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    value: lead.value || 0,
    currency: lead.currency || "IDR",
    description: lead.description || "",
    // Kita simpan sebagai string nama dulu sesuai request Anda
    company_name: lead.company?.name || "", 
    contact_name: lead.contact?.name || "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cleanCurrency = (val: string | number) => {
    return Number(String(val).replace(/\D/g, "")) || 0;
  };

  useEffect(() => {
    if (showEditModal) {
      setFormData({
        value: lead.value || 0, // Ini nanti akan jadi string di input text
        currency: lead.currency || "IDR",
        description: lead.description || "",
        company_name: lead.company?.name || "",
        contact_name: lead.contact?.name || "",
      });
    }
  }, [showEditModal, lead]);

  // HANDLE SAVE
  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.patch(`/leads/${lead.id}`, {
        value: cleanCurrency(formData.value),
        currency: formData.currency,
        description: formData.description,
        // Kirim data tambahan (pastikan backend Anda siap menerima field ini)
        company_name: formData.company_name, 
        contact_name: formData.contact_name,
      });
      
      onRefresh(); 
      setShowEditModal(false);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Gagal update data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-2 flex flex-col gap-2 h-fit max-h-[calc(85.2vh-185.2px)] overflow-y-auto transition-colors">

        {/* ===== SUMMARY SECTION ===== */}
        <div 
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" // Tambah cursor-pointer
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-white">Summary</h3>
            
            {/* Button Edit tetap Button, tapi sekarang aman karena parent-nya Div */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Mencegah accordion tertutup saat klik edit
                setShowEditModal(true);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <Edit className="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 hover:text-[#5A4FB5] dark:hover:text-[#5A4FB5]" />
            </button>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
        </div>

          {summaryOpen && (
            <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <div>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Deal Value</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {lead.currency} {Number(lead.value).toLocaleString('id-ID')}
                </span>
              </div>
              
              <div>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Company</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {lead.company?.name || "-"}
                </span>
              </div>

              <div>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Contact Person</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {lead.contact?.name || "-"}
                </span>
              </div>

              {/* Tambah Priority & Client Badge */}
              <div className="flex gap-2 pt-2">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded">
                  High Priority
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded">
                  New Client
                </span>
              </div>

              <div>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="w-3 h-3" /> 
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ===== DETAIL SECTION ===== */}
        <div className="border-b dark:border-gray-700">
          <button 
            onClick={() => setDetailOpen(!detailOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 dark:text-white">Detail</h3>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${detailOpen ? 'rotate-180' : ''}`} />
          </button>

          {detailOpen && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Your details section is empty. Add custom fields or drag and drop existing ones to populate it.
              </p>
              <button className="text-sm text-[#5A4FB5] hover:underline">
                Drag and drop fields
              </button>
            </div>
          )}
        </div>

        {/* ===== SOURCE SECTION ===== */}
        <div className="border-b dark:border-gray-700">
          <button 
            onClick={() => setSourceOpen(!sourceOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 dark:text-white">Source</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Beta</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {sourceOpen && (
            <div className="px-4 pb-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Source origin</span>
                <span className="text-gray-800 dark:text-white font-medium">API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Source channel</span>
                <span className="text-gray-800 dark:text-white">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Source channel ID</span>
                <span className="text-gray-800 dark:text-white">-</span>
              </div>
            </div>
          )}
        </div>

        {/* ===== PERSON SECTION ===== */}
        <div>
          <button 
            onClick={() => setPersonOpen(!personOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 dark:text-white">Person</h3>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${personOpen ? 'rotate-180' : ''}`} />
          </button>

          {personOpen && (
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              {lead.contact ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>{lead.contact.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>{lead.contact.phone || "862-252-9773"}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="truncate" title={lead.contact.email}>
                      {lead.contact.email || "lorem.ipsum@email.com"}
                    </span>
                    {/* Tambah badge WORK */}
                    <span className="ml-auto px-2 py-0.5 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded">
                      WORK
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No contact linked</p>
              )}
            </div>
          )}
        </div>

      {/* MODAL EDIT (Hanya Value & Desc untuk saat ini) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Edit Summary</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Deal Value</label>
                <input
                  type="text"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Contoh: PT. Mencari Cinta Sejati"
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>

              <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Contact Person</label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="Nama Kontak"
                className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
              />
            </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#5A4FB5] text-white py-2 rounded-lg font-medium hover:bg-[#4a42a5] disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}