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

  return (
    <div className="w-full h-full">
      {/* Title Section */}
      <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-gray-700" />
          <h2 className="text-[16px] font-semibold text-gray-800">Notifications settings</h2>
      </div>
          <p className="text-[12px] text-gray-500">
            Manage how you receive notifications
          </p>
      </div>

      <div className="space-y-8">
      {/* EMAIL NOTIFICATIONS */}
      <div className="space-y-2">
        <NotificationRow
          title="Deal Update"
          desc="Receive email when deals are updated"
          checked={emailDealUpdate}
          onChange={setEmailDealUpdate}
          disabled={saving}
        />

        <NotificationRow
          title="Activity Reminder"
          desc="Receive reminders for upcoming activities"
          checked={emailActivityReminder}
          onChange={setEmailActivityReminder}
          disabled={saving}
        />

        <NotificationRow
          title="Marketing"
          desc="Receive marketing emails and newsletter"
          checked={emailMarketing}
          onChange={setEmailMarketing}
          disabled={saving}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* PUSH NOTIFICATIONS */}
      <div>
      <h3 className="text-base font-semibold mb-4 text-gray-800">Push Notifications</h3>

      <div className="space-y-2">
        <NotificationRow
          title="Deal Update"
          desc="Receive push notifications when deals are updated"
          checked={pushDealUpdate}
          onChange={setPushDealUpdate}
          disabled={saving}
        />

        <NotificationRow
          title="Receive Reminder"
          desc="Receive reminders for upcoming activities"
          checked={pushReminder}
          onChange={setPushReminder}
          disabled={saving}
        />
      </div>
      </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end mt-10">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-[#5A4FB5] hover:bg-gray-900 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
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
                  <h3 className="text-lg font-semibold">Notification Updated</h3>
                  <p className="text-sm text-gray-600 mt-1">Notification settings have been saved successfully</p>
                </div>
              </div>
            )}
          </div>
  );
}

interface NotificationRowProps {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationRow({ title, desc, checked, onChange, disabled }: NotificationRowProps) {
  return (
    <div className="flex items-start justify-between">
       <div className="max-w-[80%]">
          <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
          <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
       </div>
       
       {/* TOGGLE SWITCH MODERN */}
       <label className="relative inline-flex items-center cursor-pointer">
         <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)} 
            disabled={disabled}
         />
         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5A4FB5]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A4FB5]"></div>
       </label>
    </div>
  );
}