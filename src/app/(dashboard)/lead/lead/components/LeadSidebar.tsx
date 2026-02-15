"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Edit, Calendar, User, Phone, Mail, ChevronDown, X, Plus, Check, Trash2 } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal"; // Sesuaikan path import

type LeadSidebarProps = {
  lead: any;
  onRefresh: () => void;
};

export function LeadSidebar({ lead, onRefresh }: LeadSidebarProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(true);
  const [personOpen, setPersonOpen] = useState(true);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
const [tempValue, setTempValue] = useState("");
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
const [isEditingSource, setIsEditingSource] = useState(false);
const [tempSourceOrigin, setTempSourceOrigin] = useState("");
const [tempSourceChannel, setTempSourceChannel] = useState("");
const [tempSourceId, setTempSourceId] = useState("");
const [isEditingPerson, setIsEditingPerson] = useState(false);
const [tempPersonName, setTempPersonName] = useState("");
const [tempPersonPhone, setTempPersonPhone] = useState("");
const [tempPersonEmail, setTempPersonEmail] = useState("");

const handleSavePerson = async () => {
  try {
    setSaving(true);
    await apiClient.patch(`/leads/${lead.id}`, {
      contact_name: tempPersonName,
      contact_phone: tempPersonPhone, // Pastikan backend handle ini (atau abaikan dulu jika belum)
      contact_email: tempPersonEmail,
    });
    setIsEditingPerson(false);
    onRefresh();
  } catch (error) {
    alert("Failed to update person");
  } finally {
    setSaving(false);
  }
};

const handleSaveSource = async () => {
  try {
    setSaving(true);
    
    // Kirim request PATCH ke endpoint utama Lead
    // Pastikan backend API route Anda menerima field 'sourceOrigin' & 'sourceChannel'
    await apiClient.patch(`/leads/${lead.id}`, {
      sourceOrigin: tempSourceOrigin,
      sourceChannel: tempSourceChannel,
      sourceChannelId: tempSourceId,
    });

    setIsEditingSource(false);
    onRefresh(); // Refresh data agar tampilan terupdate
  } catch (error) {
    console.error("Failed to update source:", error);
    alert("Failed to save source changes.");
  } finally {
    setSaving(false);
  }
};

// 1. Tambahkan state baru
const [showManageModal, setShowManageModal] = useState(false);
const [masterFields, setMasterFields] = useState<any[]>([]);

// 2. Fetch master fields saat modal dibuka
const openManageModal = async () => {
  try {
    const res = await apiClient.get("/custom-fields");
    setMasterFields(res.data.data);
    setShowManageModal(true);
  } catch (error) {
    console.error("Gagal ambil master fields");
  }
};

const handleSaveCustomField = async (fieldId: string) => {
  try {
    setSaving(true);
    await apiClient.post(`/leads/${lead.id}/custom-fields`, {
      fieldId,
      value: tempValue,
    });
    setEditingFieldId(null);
    onRefresh(); // Refresh data agar UI terupdate
  } catch (error) {
    console.error("Failed to save custom field:", error);
    alert("Failed to save data.");
  } finally {
    setSaving(false);
  }
};

  // State Form
  const [formData, setFormData] = useState({
    value: lead.value || 0,
    currency: lead.currency || "IDR",
    description: lead.description || "",
    company_name: lead.company?.name || "", 
    contact_name: lead.contact?.name || "",
    priority: lead.priority || "",     // Tambahan baru
    client_type: lead.clientType || "",
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
        value: lead.value || 0,
        currency: lead.currency || "IDR",
        description: lead.description || "",
        company_name: lead.company?.name || "",
        contact_name: lead.contact?.name || "",
        priority: lead.priority || "",
        client_type: lead.clientType || "",
      });
    }
  }, [showEditModal, lead]);

  // 1. Fungsi saat ikon Sampah diklik
const initiateDelete = (fieldId: string) => {
  setFieldToDelete(fieldId);
  setShowDeleteModal(true);
};

// 2. Fungsi Eksekusi (Dipanggil dari Modal)
const confirmDelete = async () => {
  if (!fieldToDelete) return;

  try {
    setSaving(true);
    await apiClient.delete(`/leads/${lead.id}/custom-fields?fieldId=${fieldToDelete}`);
    
    // Reset State
    setShowDeleteModal(false);
    setFieldToDelete(null);
    setEditingFieldId(null); // Keluar dari mode edit
    
    onRefresh(); // Refresh data
  } catch (error) {
    console.error("Failed to delete:", error);
    alert("An error occurred while deleting.");
  } finally {
    setSaving(false);
  }
};

  // HANDLE SAVE
  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.patch(`/leads/${lead.id}`, {
        value: cleanCurrency(formData.value),
        currency: formData.currency,
        description: formData.description,
        company_name: formData.company_name, 
        contact_name: formData.contact_name,
        priority: formData.priority,
      client_type: formData.client_type,
      });
      
      onRefresh(); 
      setShowEditModal(false);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update data");
    } finally {
      setSaving(false);
    }
  };

  // Collapsible Section Component
  const Section = ({ 
    title, 
    isOpen, 
    onToggle, 
    badge,
    editButton,
    children 
  }: { 
    title: string; 
    isOpen: boolean; 
    onToggle: () => void;
    badge?: React.ReactNode;
    editButton?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
          {editButton}
          {badge}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </div>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-fit max-h-[calc(96.5vh-256.5px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">

        {/* ===== SUMMARY SECTION ===== */}
        <Section
          title="Summary"
          isOpen={summaryOpen}
          onToggle={() => setSummaryOpen(!summaryOpen)}
          editButton={
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-gray-400 hover:text-[#5A4FB5]" />
            </button>
          }
        >
          <div className="px-8 pb-1 text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Deal Value</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {lead.currency} {Number(lead.value).toLocaleString('id-ID')}
              </span>
            </div>
            
            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Company</span>
              <span className="text-gray-800 dark:text-white">
                {lead.company?.name || "-"}
              </span>
            </div>

            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Contact Person</span>
              <span className="text-gray-800 dark:text-white">
                {lead.contact?.name || "-"}
              </span>
            </div>

            {/* Labels/Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
            {lead.priority && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-gray-600">
                {/* Mengubah HIGH menjadi High */}
                {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1).toLowerCase()} Priority
              </span>
            )}
            
            {lead.clientType && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-gray-600">
                {/* Mengubah NEW menjadi New Client */}
                {lead.clientType === 'NEW' ? 'New Client' : 'Repeat Client'}
              </span>
            )}
          </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-400 dark:text-gray-500">
              <Calendar className="w-3.5 h-3.5" /> 
              <span>{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </Section>

        {/* ===== DETAIL SECTION ===== */}
        <Section title="Detail" isOpen={detailOpen} onToggle={() => setDetailOpen(!detailOpen)}>
          <div className="px-8 pb-1 space-y-4">
            
            {/* KONDISI 1: JIKA KOSONG & TIDAK SEDANG EDIT */}
            {(!lead.customFieldValues || lead.customFieldValues.length === 0) && !editingFieldId && (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your details section is empty. Add custom fields to populate it.
                </p>
              </div>
            )}

            {/* KONDISI 2: RENDER DATA YANG ADA */}
            {lead.customFieldValues?.map((cfv: any) => (
              <div key={cfv.fieldId} className="group">
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                  {cfv.field.name}
                </label>

                {editingFieldId === cfv.fieldId ? (
                  /* --- TAMPILAN EDIT --- */
                  <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <input
                      autoFocus
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="flex-1 text-xs border-b border-[#5A4FB5] bg-transparent outline-none py-1 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCustomField(cfv.fieldId);
                        if (e.key === 'Escape') setEditingFieldId(null);
                      }}
                    />
                    <button 
                      onClick={() => handleSaveCustomField(cfv.fieldId)}
                      className="text-[10px] text-white bg-[#5A4FB5] p-1.5 rounded hover:bg-[#4a4194]"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => initiateDelete(cfv.fieldId)}
                      className="text-[10px] text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100 border border-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  /* --- TAMPILAN BIASA --- */
                  <div 
                    onClick={() => { setEditingFieldId(cfv.fieldId); setTempValue(cfv.value || ""); }}
                    className="text-sm font-medium hover:bg-gray-50 p-1 rounded cursor-pointer transition-colors"
                  >
                    {cfv.value || <span className="text-gray-400 italic text-xs">Empty</span>}
                  </div>
                )}
              </div>
            ))}

            {/* KONDISI 3: INPUT UNTUK FIELD BARU (DRAFT) */}
            {editingFieldId && !lead.customFieldValues?.some((cfv: any) => cfv.fieldId === editingFieldId) && (
              <div className="p-2 bg-blue-50/50 border border-dashed border-blue-200 rounded-lg animate-in slide-in-from-top-1">
                <label className="block text-[10px] font-bold text-[#5A4FB5] uppercase mb-1">
                  {masterFields.find((f: any) => f.id === editingFieldId)?.name || "New Field"}
                </label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Enter value..."
                    className="flex-1 text-xs bg-transparent border-b border-[#5A4FB5] outline-none py-1"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomField(editingFieldId)}
                  />
                  <button 
                    onClick={() => handleSaveCustomField(editingFieldId)}
                    className="text-[10px] font-bold text-white bg-[#5A4FB5] px-2 py-1 rounded"
                  >
                    ADD
                  </button>
                </div>
              </div>
            )}

            {/* TOMBOL MANAGE FIELDS (SELALU MUNCUL) */}
            <button 
              onClick={openManageModal}
              className="w-full mt-2 py-2 border-t border-gray-100 text-[11px] font-semibold text-[#5A4FB5] hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {(!lead.customFieldValues || lead.customFieldValues.length === 0) ? "Add Custom Fields" : "Manage Fields"}
            </button>
          </div>
        </Section>

        {/* ===== SOURCE SECTION ===== */}
        <Section
          title="Source"
          isOpen={sourceOpen}
          onToggle={() => setSourceOpen(!sourceOpen)}
          badge={
            <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium uppercase">
              {lead.sourceOrigin === 'Manual' ? 'Manual' : 'Tracked'}
            </span>
          }
        >
          <div className="px-8 pb-1 text-sm space-y-1">
            
            {/* 1. Source Origin (Dropdown vs Text) */}
            <div className="flex justify-between items-center min-h-[28px]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Source Origin</span>
              
              {isEditingSource ? (
                <select
                  className="text-xs border-b border-[#5A4FB5] bg-transparent outline-none text-right w-32 py-1"
                  value={tempSourceOrigin}
                  onChange={(e) => setTempSourceOrigin(e.target.value)}
                >
                  {/* Opsi Standar CRM */}
                  <option value="Manual">Manual Input</option>
                  <option value="Organic Search">Organic Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Paid Ads">Paid Ads</option>
                  <option value="Referral">Referral</option>
                  <option value="Email Campaign">Email Campaign</option>
                </select>
              ) : (
                <div 
                  onClick={() => {
                    setIsEditingSource(true);
                    setTempSourceOrigin(lead.sourceOrigin || "Manual");
                    setTempSourceChannel(lead.sourceChannel || "");
                  }}
                  className="text-xs font-medium text-gray-900 dark:text-white cursor-pointer hover:text-[#5A4FB5] border-b border-transparent hover:border-dashed hover:border-[#5A4FB5] transition-colors"
                >
                  {lead.sourceOrigin || "Manual"}
                </div>
              )}
            </div>

            {/* 2. Source Channel (Input vs Text) */}
            <div className="flex justify-between items-center min-h-[28px]">
              <span className="text-xs text-gray-500 dark:text-gray-400">Source Channel</span>
              
              {isEditingSource ? (
                <input 
                  type="text" 
                  value={tempSourceChannel}
                  onChange={(e) => setTempSourceChannel(e.target.value)}
                  className="text-xs text-right border-b border-[#5A4FB5] bg-transparent outline-none w-32 py-1"
                  placeholder="e.g. Google, LinkedIn..."
                />
              ) : (
                <span className="text-xs text-gray-900 dark:text-white max-w-[150px] truncate">
                  {lead.sourceChannel || "-"}
                </span>
              )}
            </div>

            {/* 3. Source ID (Read Only - Jarang diedit manual) */}
            <div className="flex justify-between items-center min-h-[28px]">
            <span className="text-xs text-gray-500 dark:text-gray-400">Source Channel ID</span>
            {isEditingSource ? (
              <input 
                type="text" 
                value={tempSourceId}
                onChange={(e) => setTempSourceId(e.target.value)}
                className="text-[10px] font-mono text-right border-b border-[#5A4FB5] bg-transparent outline-none w-32 py-1"
                placeholder="e.g. REF-001"
              />
            ) : (
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded select-all">
                {lead.sourceChannelId || "N/A"}
              </span>
            )}
          </div>

            {/* ACTION BUTTONS (Muncul saat Edit Mode) */}
            {isEditingSource && (
              <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-1">
                <button 
                  onClick={() => setIsEditingSource(false)}
                  className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSource}
                  disabled={saving}
                  className="text-[10px] font-bold text-[#5A4FB5] hover:text-[#4a4194] transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

          </div>
        </Section>

        {/* ===== PERSON SECTION ===== */}
<Section title="Person" isOpen={personOpen} onToggle={() => setPersonOpen(!personOpen)}>
  <div className="px-8 pb-1 space-y-3 text-sm">
    
    {/* 1. NAME */}
    <div className="flex items-center gap-3">
      <User className="w-4 h-4 text-gray-400 shrink-0" />
      {isEditingPerson ? (
        <input 
          autoFocus
          className="flex-1 border-b border-[#5A4FB5] bg-transparent outline-none text-xs py-1"
          value={tempPersonName}
          onChange={(e) => setTempPersonName(e.target.value)}
          placeholder="Contact Name"
        />
      ) : (
        <span className="text-gray-900 dark:text-white font-medium text-xs">
          {lead.contact?.name || <span className="text-gray-400 italic">No contact linked</span>}
        </span>
      )}
    </div>

    {/* 2. PHONE */}
    <div className="flex items-center gap-3">
      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
      {isEditingPerson ? (
        <input 
          className="flex-1 border-b border-[#5A4FB5] bg-transparent outline-none text-xs py-1"
          value={tempPersonPhone}
          onChange={(e) => setTempPersonPhone(e.target.value)}
          placeholder="Phone Number"
        />
      ) : (
        <span className="text-gray-600 dark:text-gray-300 text-xs">
          {lead.contact?.phone || "-"}
        </span>
      )}
    </div>

    {/* 3. EMAIL */}
    <div className="flex items-center gap-3">
      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
      {isEditingPerson ? (
        <input 
          className="flex-1 border-b border-[#5A4FB5] bg-transparent outline-none text-xs py-1"
          value={tempPersonEmail}
          onChange={(e) => setTempPersonEmail(e.target.value)}
          placeholder="Email Address"
        />
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="truncate text-gray-600 dark:text-gray-300 text-xs" title={lead.contact?.email}>
            {lead.contact?.email || "-"}
          </span>
          {lead.contact?.email && (
            <span className="px-1.5 py-0.5 bg-gray-800 dark:bg-gray-600 text-white text-[9px] rounded font-medium">
              Work
            </span>
          )}
        </div>
      )}
    </div>

    {/* ACTION BUTTONS */}
    <div className="flex justify-end pt-2 border-t border-gray-50 dark:border-gray-700/50 mt-1">
      {isEditingPerson ? (
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditingPerson(false)}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSavePerson}
            className="text-[10px] font-bold text-[#5A4FB5]"
          >
            Save
          </button>
        </div>
      ) : (
        <button 
          onClick={() => {
            setIsEditingPerson(true);
            setTempPersonName(lead.contact?.name || "");
            setTempPersonPhone(lead.contact?.phone || "");
            setTempPersonEmail(lead.contact?.email || "");
          }}
          className="text-[10px] text-gray-400 hover:text-[#5A4FB5] flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Edit Contact
        </button>
      )}
    </div>
  </div>
</Section>
      </div>

      {/* MODAL EDIT */}
{showEditModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg relative">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Lead Summary</h2>
        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Grid 2 Kolom sesuai Wireframe */}
      <div className="px-6 pt-0 p-6 grid grid-cols-2 gap-x-4 gap-y-2">
        {/* Row 1: Deal Value & Currency */}
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Deal Value</label>
          <input
            type="text"
            name="value"
            value={formData.value}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Currency</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none"
          >
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* Row 2: Company & Contact */}
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Company Name</label>
          <input
            type="text"
            name="company_name"
            placeholder="Enter Company Name"
            value={formData.company_name}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Contact Person</label>
          <input
            type="text"
            name="contact_name"
            placeholder="Enter Contact Person Name"
            value={formData.contact_name}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none"
          />
        </div>

        {/* Row 3: Priority & Client Type */}
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none text-gray-400"
          >
            <option value="">Select Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-medium mb-1 text-gray-600">Client Type</label>
          <select
            name="client_type"
            value={formData.client_type}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#5A4FB5] outline-none text-gray-400"
          >
            <option value="">Select Client Type</option>
            <option value="NEW">New Client</option>
            <option value="REPEAT">Repeat Order</option>
          </select>
        </div>

        {/* Button Row - Full Width */}
        <div className="col-span-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-64 block mx-auto bg-[#5A4FB5] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-black transition-all"
          >
            {saving ? "Saving..." : "Save Changes"} 
            {/* Note: Mengikuti teks button di wireframe image_7915da.png */}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

<ConfirmationModal
  open={showDeleteModal}
  type="delete"
  onClose={() => setShowDeleteModal(false)}
  onConfirm={confirmDelete}
  // Kita override teksnya agar sesuai konteks
  title="Remove Field?"
  desc="Are you sure? This field and its value will be removed from this lead."
/>

{showManageModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex justify-between items-center">
        <h3 className="font-bold text-sm">Add Detail Field</h3>
        <button onClick={() => setShowManageModal(false)}><X className="w-4 h-4 text-gray-400"/></button>
      </div>
      <div className="p-2 max-h-60 overflow-y-auto">
        {masterFields.map((field) => {
          // Cek apakah field ini sudah ada di lead
          const isExists = lead.customFieldValues?.some((cfv: any) => cfv.fieldId === field.id);
          
          return (
            <button
              key={field.id}
              disabled={isExists}
              onClick={() => {
                setEditingFieldId(field.id);
                setTempValue("");
                setShowManageModal(false);
                // Kita buatkan input kosong di UI sidebar
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm flex justify-between items-center ${
                isExists ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              <span>{field.name}</span>
              {isExists ? <Check className="w-4 h-4 text-green-500" /> : <Plus className="w-4 h-4 text-gray-300" />}
            </button>
          );
        })}
      </div>
    </div>
  </div>
)}
    </>
  );
}

