"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Calendar, User, Tag, Contact } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@/lib/apiClient"; // Gunakan client API Anda

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback untuk refresh data setelah sukses
}

// Tipe data sederhana untuk dropdown
type Option = { id: string; name: string };

export default function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  // State Form
  const [leadTitle, setLeadTitle] = useState("");
  const [value, setValue] = useState<number | "">(""); // Biarkan string kosong awalnya
  const [currency, setCurrency] = useState("IDR");
  const [stage, setStage] = useState("Lead In"); // Default stage
  const [labelId, setLabelId] = useState("");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState(""); // Opsional (jika admin)
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");

  // State Data Dropdown (Dinamis)
  const [labels, setLabels] = useState<Option[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [teamMembers, setTeamMembers] = useState<Option[]>([]);
  
  const [loading, setLoading] = useState(false);

  // 1. Fetch Data Pendukung saat Modal Dibuka
  useEffect(() => {
    if (open) {
      const fetchMetadata = async () => {
        try {
          // Panggil endpoint metadata yang sudah Anda buat
          const [labelsRes, contactsRes, teamRes] = await Promise.all([
            apiClient.get("/metadata/labels"),
            apiClient.get("/metadata/contacts"),
            apiClient.get("/metadata/team-members"),
          ]);

          setLabels(labelsRes.data.data);
          setContacts(contactsRes.data.data);
          
          // Mapping data team member agar sesuai format Option {id, name}
          const members = teamRes.data.data.map((m: any) => ({ 
            id: m.id, 
            name: m.fullName 
          }));
          setTeamMembers(members);

        } catch (error) {
          console.error("Gagal memuat data dropdown:", error);
        }
      };
      
      fetchMetadata();
    }
  }, [open]);

  // 2. Fungsi Submit
  const handleSubmit = async () => {
    if (!leadTitle) return alert("Title is required!");
    
    setLoading(true);
    try {
      const payload = {
        title: leadTitle,
        value: Number(value) || 0,
        currency,
        stage,
        description,
        dueDate: dueDate ? dueDate.toISOString() : undefined, // Konversi ke ISO String
        labelId: labelId || undefined,
        contactId: contactId || undefined,
        ownerId: ownerId || undefined, 
        // companyId: ... (jika ada dropdown company, tambahkan di sini)
      };

      await apiClient.post("/leads", payload);

      // Reset form dan tutup modal
      onClose();
      if (onSuccess) onSuccess(); // Refresh halaman utama
      
      // Reset state form
      setLeadTitle("");
      setValue("");
      setDescription("");
      setDueDate(null);
      
    } catch (error) {
      console.error("Gagal membuat Lead:", error);
      alert("Terjadi kesalahan saat membuat Lead.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* === Header === */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#5A4FB5] p-3 rounded-full flex items-center justify-center">
            <ShoppingBag className="text-white w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-semibold text-[#2E2E2E] dark:text-white">
            Create New Lead
          </h2>
        </div>

        {/* === Form === */}
        <div className="flex flex-col gap-3 text-sm">
          {/* Lead Title */}
          <div>
            <label className="block font-medium mb-1 dark:text-gray-200">Lead Title</label>
            <input
              type="text"
              placeholder="Enter Lead Title"
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Value + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-medium mb-1 dark:text-gray-200">Value</label>
              <input
                type="number"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.valueAsNumber || "")}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="w-24">
              <label className="block font-medium mb-1 dark:text-gray-200">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
              >
                <option>IDR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          {/* Stage + Label */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-medium mb-1 dark:text-gray-200">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
              >
                <option>Lead In</option>
                <option>Contact Mode</option>
                <option>Need Identified</option>
                <option>Proposal Mode</option>
                <option>Negotiation</option>
                <option>Contract Sent</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block font-medium mb-1 dark:text-gray-200">Label</label>
              <select
                value={labelId}
                onChange={(e) => setLabelId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select Label</option>
                {/* 💡 MAP DATA DARI BACKEND */}
                {labels.map((lbl) => (
                  <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact (Dropdown Dinamis) */}
          <div>
            <label className="block font-medium mb-1 dark:text-gray-200">Contact</label>
            <div className="relative">
                <Contact size={16} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"/>
                <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
                >
                    <option value="">Select Contact Person</option>
                    {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.name}</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Team Member (Dropdown Dinamis) */}
          <div>
            <label className="block font-medium mb-1 dark:text-gray-200">Team Member (Owner)</label>
            <div className="relative">
                <User size={16} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"/>
                <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] dark:bg-gray-900 dark:text-white"
                >
                    <option value="">Assign to Me (Default)</option>
                    {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block font-medium mb-1 dark:text-gray-200">Due Date</label>
            <div className="relative w-full dark:text-white dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700 dark:[&_input]:text-white">
              <Calendar
                size={16}
                className="absolute left-3 top-3 text-gray-500 dark:text-gray-400 pointer-events-none z-10"
              />
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                placeholderText="Select Date"
                className="w-full pl-9 border border-gray-300 dark:border-gray-700 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] bg-transparent"
                wrapperClassName="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1 dark:text-gray-200">Description</label>
            <textarea
              placeholder="Enter Lead Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              className="w-full h-24 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] resize-none dark:bg-gray-900 dark:text-white"
            />
            <div className="text-right text-xs text-gray-400 dark:text-gray-500">
              {description.length}/100
            </div>
          </div>
        </div>

        {/* Create Lead Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 w-full bg-[#5A4FB5] text-white font-medium py-2.5 rounded-full hover:bg-[#493e9b] transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}