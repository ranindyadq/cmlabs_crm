"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Calendar, User, Tag, Contact } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@/lib/apiClient";

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Option = { id: string; name: string };

export default function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [leadTitle, setLeadTitle] = useState("");
  const [value, setValue] = useState(""); 
  const [currency, setCurrency] = useState("IDR");
  const [stage, setStage] = useState("");
  const [labelId, setLabelId] = useState("");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");

  const [labels, setLabels] = useState<Option[]>([]);
  const [contacts, setContacts] = useState<Option[]>([]);
  const [teamMembers, setTeamMembers] = useState<Option[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchMetadata = async () => {
        try {
          const [labelsRes, contactsRes, teamRes] = await Promise.all([
            apiClient.get("/metadata/labels"),
            apiClient.get("/metadata/contacts"),
            apiClient.get("/metadata/team-members"),
          ]);

          setLabels(labelsRes.data.data);
          setContacts(contactsRes.data.data);
          
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

  const cleanCurrency = (val: string | number) => {
    return Number(String(val).replace(/\D/g, "")) || 0;
  };

  const handleSubmit = async () => {
    if (!leadTitle) return alert("Title is required!");
    
    setLoading(true);
    try {
      const payload = {
        title: leadTitle,
        value: cleanCurrency(value),
        currency,
        stage,
        description,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        labelId: labelId || undefined,
        contactId: contactId || undefined,
        ownerId: ownerId || undefined,
      };

      await apiClient.post("/leads", payload);

      onClose();
      if (onSuccess) onSuccess();
      
      setLeadTitle("");
      setValue("");
      setDescription("");
      setDueDate(null);
      setStage("");
      setLabelId("");
      setContactId("");
      setOwnerId("");
      
    } catch (error) {
      console.error("Gagal membuat Lead:", error);
      alert("Terjadi kesalahan saat membuat Lead.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-5 w-full max-w-xl relative max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#5A4FB5] dark:bg-white p-2 rounded-full flex items-center justify-center">
            <ShoppingBag className="text-white dark:text-black w-4 h-4" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Lead
          </h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-2">
          {/* Lead Title */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
              Lead Title
            </label>
            <input
              type="text"
              placeholder="Enter Lead Title"
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          {/* Value + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Value
              </label>
              <input
                type="text"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
              >
                <option>IDR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          {/* Stage + Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
              >
                <option value="">Select Stage</option>
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

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Label
              </label>
              <select
                value={labelId}
                onChange={(e) => setLabelId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 appearance-none cursor-pointer"
              >
                <option value="">Select Label</option>
                {labels.map((lbl) => (
                  <option key={lbl.id} value={lbl.id}>{lbl.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
              Contacts
            </label>
            <input
              type="text"
              placeholder="Enter Contacts Name"
              value={contacts.find(c => c.id === contactId)?.name || ""}
              onChange={(e) => {
                const contact = contacts.find(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()));
                setContactId(contact?.id || "");
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          {/* Team Member */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
              Team Member
            </label>
            <input
              type="text"
              placeholder="Enter Team Member Name"
              value={teamMembers.find(m => m.id === ownerId)?.name || ""}
              onChange={(e) => {
                const member = teamMembers.find(m => m.name.toLowerCase().includes(e.target.value.toLowerCase()));
                setOwnerId(member?.id || "");
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
              Due Date
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10"
              />
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                placeholderText="Select Date"
                className="w-full pl-10 pr-3 py-1.5 border text-sm border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
                wrapperClassName="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="Enter Lead Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              className="w-full h-15 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
            />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description.length}/100
            </div>
          </div>
        </div>

        {/* Create Lead Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-1 w-64 block mx-auto bg-[#5A4FB5] dark:bg-white text-white dark:text-black font-medium py-2 rounded-full hover:bg-[#4B42A8] dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>
      </div>
    </div>
  );
}