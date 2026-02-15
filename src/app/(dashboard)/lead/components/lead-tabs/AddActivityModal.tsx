// src/app/(dashboard)/lead/components/lead-tabs/AddActivityModal.tsx
"use client";

import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { X, ChevronDown } from "lucide-react";

interface AddActivityModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddActivityModal({
  leadId,
  isOpen,
  onClose,
  onSuccess
}: AddActivityModalProps) {
  const [activityType, setActivityType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const maxChars = 100;

  const activityTypes = [
    { value: "NOTE", label: "Note" },
    { value: "CALL", label: "Call" },
    { value: "EMAIL", label: "Email" },
    { value: "MEETING", label: "Meeting" },
    { value: "INVOICE_CREATED", label: "Invoice" },
  ];

  const resetForm = () => {
    setActivityType("");
    setTitle("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!activityType) {
      alert("Please select activity type");
      return;
    }
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      // Create activity based on type
      switch (activityType) {
        case "NOTE":
          await apiClient.post(`/leads/${leadId}/notes`, {
            title: title.trim(),
            content: description.trim()
          });
          break;
        case "CALL":
          await apiClient.post(`/leads/${leadId}/calls`, {
            title: title.trim(),
            notes: description.trim(),
            callTime: new Date().toISOString(),
            status: "COMPLETED",
            result: "Follow Up"
          });
          break;
        case "EMAIL":
          await apiClient.post(`/leads/${leadId}/emails`, {
            subject: title.trim(),
            body: description.trim(),
            toAddress: "client@email.com",
            fromAddress: "system@cmlabs.co"
          });
          break;
        case "MEETING":
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
          await apiClient.post(`/leads/${leadId}/meetings`, {
            title: title.trim(),
            description: description.trim(),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: "Online",
            reminderMinutesBefore: 5
          });
          break;
      }

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating activity:", error);
      alert(error.response?.data?.message || "Failed to create activity");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Activity
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-0 space-y-2">
          {/* Activity Type & Title - 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Activity Type
              </label>
              <div className="relative">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full appearance-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent pr-8"
                >
                  <option value="">Select</option>
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Title"
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, maxChars))}
                placeholder="Enter Lead Description"
                rows={4}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5] focus:border-transparent resize-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                {description.length}/{maxChars}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center px-6 py-4">
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[#5A4FB5] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#483d96] disabled:opacity-50 transition"
          >
            {submitting ? "Creating..." : "Create Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}