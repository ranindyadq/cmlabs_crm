"use client";

import {
  Filter,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import ActivityTimeline from "./lead-tabs/ActivityTimeline";
import NotesTab from "./lead-tabs/NotesTab";
import MeetingTab from "./lead-tabs/MeetingTab";
import CallTab from "./lead-tabs/CallTab";
import EmailTab from "./lead-tabs/EmailTab";
import InvoiceTab from "./lead-tabs/InvoiceTab";

export function LeadTabs({ lead, onRefresh }: { lead: any; onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState("Activity Timeline");
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  
  const activityCounts = lead.activityCounts || {
    notes: 0,
    meetings: 0,
    calls: 0,
    emails: 0,
    invoices: 0,
  };

  const tabs = [
    "Activity Timeline",
    "Notes",
    "Meeting",
    "Call",
    "E-mail",
    "Invoice",
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const scrollPipeline = (dir: "up" | "down") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      top: dir === "up" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const syncThumb = () => {
    const scroll = scrollRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!scroll || !track || !thumb) return;

    const ratio = scroll.scrollTop / (scroll.scrollHeight - scroll.clientHeight);
    const maxOffset = track.clientHeight - thumb.clientHeight;
    thumb.style.top = `${ratio * maxOffset}px`;
  };

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const scroll = scrollRef.current;
    if (!track || !thumb || !scroll) return;

    syncThumb();

    let isDrag = false;
    let startY = 0;
    let startScroll = 0;

    const down = (e: MouseEvent) => {
      isDrag = true;
      startY = e.clientY;
      startScroll = scroll.scrollTop;
      document.body.style.userSelect = "none";
    };

    const move = (e: MouseEvent) => {
      if (!isDrag) return;
      const dy = e.clientY - startY;
      const scrollHeight = scroll.scrollHeight - scroll.clientHeight;
      const trackHeight = track.clientHeight - thumb.clientHeight;
      const ratio = scrollHeight / trackHeight;
      scroll.scrollTop = startScroll + dy * ratio;
      syncThumb();
    };

    const up = () => {
      isDrag = false;
      document.body.style.userSelect = "";
    };

    thumb.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    scroll.addEventListener("scroll", syncThumb);

    return () => {
      thumb.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      scroll.removeEventListener("scroll", syncThumb);
    };
  }, [activeTab, lead]);

  return (
    <div className="flex gap-2 h-[calc(85.2vh-185.2px)]">
      {/* ===== CARD CONTENT ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow flex flex-1 flex-col h-full overflow-hidden transition-colors">
        
        {/* Search Bar dengan styling yang match */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search activity, notes, email, and more..."
              className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
            />
          </div>
        </div>

        {/* Tabs dengan Filter & Add Note button */}
        <div className="px-6 pt-3 border-b dark:border-gray-700">
          {/* Tabs */}
          <div className="flex gap-10 overflow-x-auto no-scrollbar mb-3">
            {tabs.map((tab) => {
              let key: string = '';
              switch (tab) {
                case 'Notes': key = 'notes'; break;
                case 'Meeting': key = 'meetings'; break;
                case 'Call': key = 'calls'; break;
                case 'E-mail': key = 'emails'; break;
                case 'Invoice': key = 'invoices'; break;
                default: key = '';
              }
              
              const count = activityCounts[key] || 0;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "text-[#5A4FB5] border-b-2 border-[#5A4FB5]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab 
                        ? "bg-[#5A4FB5]/10 text-[#5A4FB5]" 
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons dibawah tabs - Filter & Add Note */}
          <div className="flex items-center gap-10 pb-3">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {activeTab === "Notes" && (
              <button 
                onClick={() => setShowAddNote(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#5A4FB5] text-white hover:bg-[#4a42a5] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            )}

            {activeTab === "Meeting" && (
              <button 
                onClick={() => setShowAddMeeting(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#5A4FB5] text-white hover:bg-[#4a42a5] rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Meeting
              </button>
            )}
          </div>
        </div>

        {/* ===== SCROLLABLE CONTENT ===== */}
        <div
          ref={scrollRef}
          className="overflow-y-auto flex-1 min-h-0 scroll-smooth text-gray-800 dark:text-gray-200 p-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {activeTab === "Activity Timeline" && (
            <ActivityTimeline leadId={lead.id} onRefresh={onRefresh} />
          )}
          
          {activeTab === "Notes" && (
            <NotesTab 
              leadId={lead.id} 
              showForm={showAddNote} 
              setShowForm={setShowAddNote} 
              onRefresh={onRefresh} // <--- Tambahkan ini
            />
          )}

          {activeTab === "Meeting" && (
            <MeetingTab 
              leadId={lead.id} 
              showForm={showAddMeeting} 
              setShowForm={setShowAddMeeting}
              onRefresh={onRefresh} // <--- Tambahkan ini
            />
          )}

          {activeTab === "Call" && (
            <CallTab leadId={lead.id} onRefresh={onRefresh} />
          )}

          {activeTab === "E-mail" && (
            <EmailTab leadId={lead.id} onRefresh={onRefresh} />
          )}

          {activeTab === "Invoice" && (
            <InvoiceTab leadId={lead.id} onRefresh={onRefresh} />
          )}
        </div>
      </div>

      {/* ===== CUSTOM SCROLLBAR ===== */}
      <div className="flex flex-col items-center justify-between py-1">
        <button
          onClick={() => scrollPipeline("up")}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronUp size={16} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div
          ref={trackRef}
          className="relative w-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
        >
          <div
            ref={thumbRef}
            className="absolute top-0 left-0 w-2 bg-[#B4A3FF] dark:bg-[#7a6fd6] rounded-full h-1/4 cursor-grab active:cursor-grabbing hover:bg-[#9a86f7] transition-colors"
          />
        </div>

        <button
          onClick={() => scrollPipeline("down")}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}