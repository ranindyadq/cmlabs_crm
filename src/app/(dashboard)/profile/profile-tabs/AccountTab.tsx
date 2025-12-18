"use client";

import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import {
  Lock,
  AlertTriangle,
  FileCheck,
  Save,
  Loader2
} from "lucide-react";

export default function AccountTab() {
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ERROR STATES
  const [currentError, setCurrentError] = useState<string>("");
  const [newError, setNewError] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string[]>([]);

  // === SAVE CONFIRMATION POPUP ===
  const [savePopup, setSavePopup] = useState(false);

  const handleSave = async () => {
  // 1. Reset Error States
  setCurrentError("");
  setNewError([]);
  setConfirmError([]);
  let hasError = false;

  // 2. Validasi Frontend (New & Confirm Password)
  const newErrorsList: string[] = [];
  if (newPassword.length < 8) newErrorsList.push("Password must be at least 8 characters");
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    newErrorsList.push("Include a combination of letters and numbers");
  }
  if (newPassword === currentPassword) newErrorsList.push("New password cannot be the same as current");
  
  if (newErrorsList.length > 0) {
    setNewError(newErrorsList);
    hasError = true;
  }

  if (confirmPassword !== newPassword) {
    setConfirmError(["Confirmation password does not match"]);
    hasError = true;
  }

  if (hasError) return;

  // 3. Panggil API Backend
  try {
    setLoading(true);
    await apiClient.post("/profile/change-password", {
      currentPassword,
      newPassword,
    });

    // Jika sukses
    setSavePopup(true);
    // Reset form setelah sukses
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSavePopup(false), 2000);
    
  } catch (error: any) {
    // Tangkap error dari backend (misal: "Password saat ini salah")
    const serverMessage = error.response?.data?.message || "Failed to change password";
    setCurrentError(serverMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full px-6 py-1">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-gray-700" />
        <div>
          <h2 className="text-[17px] font-semibold text-gray-700">Account</h2>
          <p className="text-sm text-gray-500">Manage your account</p>
        </div>
      </div>

      <h3 className="font-semibold text-gray-700 mb-3">Password</h3>

      {/* ==================== CURRENT PASSWORD ==================== */}
      <label className="text-sm font-medium">Current Password</label>
      <div className="relative mt-1">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder=""
          className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none 
          ${currentError ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-[#5A4FB5]"}`}
        />
        {currentError && (
          <AlertTriangle className="absolute right-3 top-2.5 text-red-500 w-5 h-5" />
        )}
      </div>
      {currentError && (
        <p className="text-xs text-red-500 mt-1">{currentError}</p>
      )}

      {/* ==================== NEW PASSWORD ==================== */}
      <label className="text-sm font-medium mt-5 block">New Password</label>
      <div className="relative mt-1">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder=""
          className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none 
          ${newError.length > 0 ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-[#5A4FB5]"}`}
        />
        {newError.length > 0 && (
          <AlertTriangle className="absolute right-3 top-2.5 text-red-500 w-5 h-5" />
        )}
      </div>

      {newError.length > 0 && (
        <div className="mt-1 space-y-1">
          {newError.map((err, index) => (
            <p key={index} className="text-xs text-red-500">{err}</p>
          ))}
        </div>
      )}

      {/* ==================== CONFIRM PASSWORD ==================== */}
      <label className="text-sm font-medium mt-5 block">Confirm Password</label>
      <div className="relative mt-1">
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder=""
          className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none 
          ${confirmError.length > 0 ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-[#5A4FB5]"}`}
        />
        {confirmError.length > 0 && (
          <AlertTriangle className="absolute right-3 top-2.5 text-red-500 w-5 h-5" />
        )}
      </div>

      {confirmError.length > 0 && (
        <div className="mt-1 space-y-1">
          {confirmError.map((err, index) => (
            <p key={index} className="text-xs text-red-500">{err}</p>
          ))}
        </div>
      )}

      {/* ==================== SAVE BUTTON ==================== */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={loading} // Cegah klik ganda
          className="px-6 py-2 rounded-full bg-[#5A4FB5] text-white text-sm font-medium flex items-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {loading ? "Processing..." : "Save Changes"}
        </button>
      </div>

      {/* ==================== SAVE CONFIRMATION POPUP ==================== */}
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
