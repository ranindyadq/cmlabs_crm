"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, Video, Calendar, Clock, MapPin } from "lucide-react";

// 1. UPDATE INTERFACE PROPS
interface MeetingTabProps {
  leadId: string;
  onRefresh?: () => void;
  showForm?: boolean;      
  setShowForm?: (val: boolean) => void;
}

export default function MeetingTab({ 
  leadId, 
  onRefresh,
  showForm,     // Ambil dari props
  setShowForm   // Ambil dari props
}: MeetingTabProps) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isModalOpen = showForm || false;
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [location, setLocation] = useState("Online");
  const [link, setLink] = useState("");
  const [outcome, setOutcome] = useState("");

  // 1. FETCH MEETINGS
  const fetchMeetings = async () => {
    try {
      onRefresh?.();
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}?activity_type=MEETING`);
      // Backend mengembalikan object lead dengan include meetings
      setMeetings(res.data.data.meetings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchMeetings();
  }, [leadId]);

  // Helper untuk menutup modal (memanggil fungsi parent)
  const handleClose = () => {
    if (setShowForm) setShowForm(false);
  };

  // 2. CREATE MEETING
  const handleCreate = async () => {
    if (!title || !startDate) return alert("Judul dan Tanggal wajib diisi");

    try {
      // Hitung End Time (default 1 jam setelah start)
      const endTime = new Date(startDate.getTime() + 60 * 60 * 1000);

      await apiClient.post(`/leads/${leadId}/meetings`, {
        title,
        description,
        startTime: startDate.toISOString(),
        endTime: endTime.toISOString(),
        location,
        meetingLink: link,
        outcome,
      });

      handleClose(); // Gunakan helper close
      fetchMeetings();
      setTitle(""); setDescription("");
    } catch (error) {
      alert("Gagal membuat meeting");
    }
  };
  
  return (
    <div>
      {/* LIST MEETINGS */}
      <div className="space-y-4">
        {loading ? (
           <p className="text-center text-gray-400 text-sm">Loading meetings...</p>
        ) : meetings.length === 0 ? (
           <p className="text-center text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-700 py-6 rounded">No meetings scheduled.</p>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm p-5 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] transition">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-[#5A4FB5] p-2 rounded-full text-white">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-base">{m.title}</h3>
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-xs mt-1">
                       <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(m.startTime).toLocaleDateString()}</span>
                       <span className="flex items-center gap-1"><Clock size={12}/> {new Date(m.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       {m.location && <span className="flex items-center gap-1"><MapPin size={12}/> {m.location}</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pl-11 text-sm text-gray-600 dark:text-gray-300">
                 {m.description || "No description provided."}
              </div>
              
              {m.meetingLink && (
                  <div className="mt-3 pl-11">
                      <a href={m.meetingLink} target="_blank" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                          Join Meeting
                      </a>
                  </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL ADD MEETING */}
      {isModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-[600px] max-w-full shadow-xl">
          
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-1 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">
              Add New Meeting
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
            >
              ✕
            </button>
          </div>

          {/* CONTENT */}
          <div className="px-6 py-1 space-y-1">

            {/* Meeting Title */}
            <div>
              <label className="text-sm font-medium dark:text-gray-200">
                Meeting Title
              </label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm                          dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter Meeting..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium dark:text-gray-200">
                Description
              </label>
              <textarea
                className="mt-1 w-full border rounded-lg px-3 py1 text-sm h-15
                          dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Describe your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* TIME & DATE */}
            <div>
              <h4 className="text-sm font-semibold mb-2 dark:text-white">
                Time and date
              </h4>

              <div className="grid grid-cols-2 gap-0">
                {/* Date */}
                <div>
                  <label className="text-xs text-gray-500">Date</label>
                  <div className="mt-1 dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700">
                    <DatePicker
                      selected={startDate}
                      onChange={(d) => setStartDate(d)}
                      dateFormat="PPP"
                      className="w-full border rounded-lg px-3 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Attendees (Dummy UI) */}
                <div>
                  <label className="text-xs text-gray-500">Attendees</label>
                  <div className="mt-1 border rounded-lg px-3 py-1 text-sm text-gray-400 dark:border-gray-700">
                    Choose Attendees
                  </div>
                </div>

                {/* Start Time */}
                <div>
                  <label className="text-xs text-gray-500">Start time</label>
                  <div className="mt-1 dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700">
                    <DatePicker
                      selected={startDate}
                      onChange={(d) => setStartDate(d)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      dateFormat="h:mm aa"
                      className="w-full border rounded-lg px-3 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* End Time (auto 1 hour UI only) */}
                <div>
                  <label className="text-xs text-gray-500">End time</label>
                  <div className="mt-1 border rounded-lg px-3 py-1 text-sm text-gray-400 dark:border-gray-700">
                    Auto (1 hour)
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs text-gray-500">Location</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm                              dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Choose Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Reminder */}
                <div>
                  <label className="text-xs text-gray-500">Reminder</label>
                  <div className="mt-1 border rounded-lg px-3 py-1 text-sm text-gray-400 dark:border-gray-700">
                    5 minutes before
                  </div>
                </div>
              </div>
            </div>

            {/* Link Meeting */}
            <div>
              <label className="text-sm font-medium dark:text-gray-200">
                Link Meeting
              </label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm                          dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Input Link Meeting..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="text-sm font-medium dark:text-gray-200">
                Outcome
              </label>
              <textarea
                className="mt-1 w-full border rounded-lg px-3 py-1 text-sm h-15
                          dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Describe the meeting outcome..."
                value={outcome}                          // <--- Tambahkan ini
                onChange={(e) => setOutcome(e.target.value)} // <--- Tambahkan ini
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-1 border-t dark:border-gray-700 flex justify-center">
            <button
              onClick={handleCreate}
              className="px-8 py-2.5 rounded-full bg-black text-white text-sm
                        hover:bg-gray-800 transition"
            >
              Create Meeting
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
