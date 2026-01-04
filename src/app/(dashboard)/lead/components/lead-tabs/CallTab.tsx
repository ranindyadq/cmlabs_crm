// src/app/(dashboard)/lead/components/lead-tabs/CallTab.tsx
"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Phone, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function CallTab({  leadId, 
  onRefresh 
}: { 
  leadId: string; 
  onRefresh?: () => void;
}) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [callDate, setCallDate] = useState<Date | null>(new Date());
  const [status, setStatus] = useState("COMPLETED");
  const [result, setResult] = useState("Interested");

  // 1. FETCH CALLS
  const fetchCalls = async () => {
    try {
      onRefresh?.();
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}?activity_type=CALL`);
      setCalls(res.data.data.calls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchCalls();
  }, [leadId]);

  // Helper: Reset Form
  const resetForm = () => {
    setTitle("");
    setNotes("");
    setCallDate(new Date());
    setStatus("COMPLETED");
    setResult("Interested");
    setEditingId(null);
    setShowModal(false);
  };

  // 2. OPEN CREATE MODAL
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // 3. OPEN EDIT MODAL
  const openEditModal = (call: any) => {
    setEditingId(call.id);
    setTitle(call.title || "");
    setNotes(call.notes || "");
    setCallDate(call.callTime ? new Date(call.callTime) : new Date());
    setStatus(call.status);
    setResult(call.result);
    setShowModal(true);
  };

  // 4. HANDLE SAVE (CREATE OR UPDATE)
  const handleSave = async () => {
    try {
      setSubmitting(true);
      const payload = {
        title,
        notes,
        callTime: callDate?.toISOString(),
        status,
        result,
      };

      if (editingId) {
        // UPDATE Existing
        await apiClient.patch(`/calls/${editingId}`, payload);
      } else {
        // CREATE New
        await apiClient.post(`/leads/${leadId}/calls`, payload);
      }

      fetchCalls();
      resetForm();
    } catch (error) {
      alert("Failed to save call log");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. DELETE CALL
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this call log?")) return;

    try {
      await apiClient.delete(`/calls/${id}`);
      setCalls((prev) => prev.filter((c) => c.id !== id)); // Optimistic update
    } catch (error) {
      alert("Failed to delete call");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#5A4FB5] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#4a4194] transition"
        >
          <Plus className="w-4 h-4" /> Log Call
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-sm text-gray-400">Loading calls...</p>
        ) : calls.length === 0 ? (
          <p className="text-center text-sm text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 py-6 rounded">
            No call logs found.
          </p>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full text-white ${
                      call.status === "MISSED" ? "bg-red-500" : "bg-green-600"
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {call.title || "No Title"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(call.callTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded h-fit">
                    {call.result}
                  </span>
                  
                  {/* Actions: Visible on Hover */}
                  <div className="flex gap-1 pl-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(call)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(call.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              {call.notes && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 pl-11">
                  {call.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL (Unified for Add & Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[450px] shadow-lg">
            <h3 className="font-bold mb-4 dark:text-white">
              {editingId ? "Edit Call Log" : "Log a Call"}
            </h3>
            <div className="space-y-3 text-sm">
              <input
                className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded"
                placeholder="Call Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="dark:text-white dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700 dark:[&_input]:text-white">
                <DatePicker
                  selected={callDate}
                  onChange={(d) => setCallDate(d)}
                  showTimeSelect
                  dateFormat="Pp"
                  className="w-full border dark:border-gray-700 p-2 rounded bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="MISSED">Missed</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
                <select
                  className="border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                >
                  <option>Interested</option>
                  <option>Not Interested</option>
                  <option>Follow Up</option>
                </select>
              </div>

              <textarea
                className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded h-20"
                placeholder="Call Notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                onClick={handleSave}
                disabled={submitting}
                className="w-full bg-[#5A4FB5] text-white py-2 rounded-full mt-2 hover:bg-[#4a4194] transition flex justify-center items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Update Log" : "Save Log"}
              </button>
              <button
                onClick={resetForm}
                className="w-full text-gray-500 dark:text-gray-400 py-2 text-xs hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}