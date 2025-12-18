"use client"; // Pastikan ini ada

import { useState, useEffect } from "react";
import { Bell, FileCheck, Save, Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient"; // Pastikan path benar
import toast from "react-hot-toast";

export default function NotificationsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savePopup, setSavePopup] = useState(false);

  // State Toggle
  const [emailDealUpdate, setEmailDealUpdate] = useState(true);
  const [emailActivityReminder, setEmailActivityReminder] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);

  const [pushDealUpdate, setPushDealUpdate] = useState(true);
  const [pushReminder, setPushReminder] = useState(true);

  // 1. FETCH DATA SAAT LOAD
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await apiClient.get("/profile/notifications");
        const data = res.data.data;
        
        if (data) {
          setEmailDealUpdate(data.emailDealUpdates);
          setEmailActivityReminder(data.emailActivityReminders);
          setEmailMarketing(data.emailMarketing);
          setPushDealUpdate(data.pushDealUpdates);
          setPushReminder(data.pushReminders);
        }
      } catch (error) {
        console.error("Gagal memuat setting notifikasi", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  // 2. HANDLE SAVE KE DATABASE
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        emailDealUpdates: emailDealUpdate,
        emailActivityReminders: emailActivityReminder,
        emailMarketing: emailMarketing,
        pushDealUpdates: pushDealUpdate,
        pushReminders: pushReminder,
      };

      await apiClient.patch("/profile/notifications", payload);

      // Tampilkan Popup Sukses
      setSavePopup(true);
      setTimeout(() => setSavePopup(false), 1500);
    } catch (error) {
      console.error("Gagal menyimpan", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#5A4FB5]" /></div>;
  }

  return (
    <div className="w-full px-6 py-1">
      {/* Title Section */}
      <div className="flex items-center gap-2 mb-6">
        <Bell size={22} className="text-gray-700" />
        <div>
          <h2 className="text-[17px] font-semibold text-gray-800">Notifications settings</h2>
          <p className="text-sm text-gray-500">
            Manage how you receive notifications
          </p>
        </div>
      </div>

      {/* EMAIL NOTIFICATIONS */}
      <div className="space-y-6">
        <NotificationItem
          title="Deal Update"
          desc="Receive email when deals are updated"
          enabled={emailDealUpdate}
          setEnabled={setEmailDealUpdate}
          disabled={saving}
        />

        <NotificationItem
          title="Activity Reminder"
          desc="Receive reminders for upcoming activities"
          enabled={emailActivityReminder}
          setEnabled={setEmailActivityReminder}
          disabled={saving}
        />

        <NotificationItem
          title="Marketing"
          desc="Receive marketing emails and newsletter"
          enabled={emailMarketing}
          setEnabled={setEmailMarketing}
          disabled={saving}
        />
      </div>

      {/* Divider */}
      <div className="border-t my-8"></div>

      {/* PUSH NOTIFICATIONS */}
      <h3 className="text-base font-semibold mb-4 text-gray-800">Push Notifications</h3>

      <div className="space-y-6">
        <NotificationItem
          title="Deal Update"
          desc="Receive push notifications when deals are updated"
          enabled={pushDealUpdate}
          setEnabled={setPushDealUpdate}
          disabled={saving}
        />

        <NotificationItem
          title="Receive Reminder"
          desc="Receive reminders for upcoming activities"
          enabled={pushReminder}
          setEnabled={setPushReminder}
          disabled={saving}
        />
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end mt-10">
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-full bg-[#5A4FB5] text-white text-sm font-medium flex items-center gap-2"
        >
          <Save size={16} className="text-white" />
          Save Changes
        </button>
      </div>

      {/* SAVE CONFIRMATION POPUP */}
      {savePopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <FileCheck size={32} color="white" />
            </div>

            <h3 className="text-lg font-semibold">Saved</h3>
            <p className="text-sm text-gray-600 mt-1">Changes have been updated</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================
   COMPONENT: Notification Item
   ====================== */
function NotificationItem({
  title,
  desc,
  enabled,
  setEnabled,
  disabled,
}: {
  title: string;
  desc: string;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-gray-800 font-medium">{title}</h4>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>

      {/* CUSTOM TOGGLE */}
      <button
        disabled={disabled}
        onClick={() => !disabled && setEnabled(!enabled)}
        className={`
          w-12 h-6 flex items-center rounded-full transition-all 
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
          ${enabled ? "bg-[#5A4FB5]" : "bg-gray-300"}
        `}
      >
        <span
          className={`
            w-5 h-5 bg-white rounded-full shadow transform transition-all
            ${enabled ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}
