"use client";

import {
  Filter,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import ActivityTimeline from "./lead-tabs/ActivityTimeline";
import NotesTab from "./lead-tabs/NotesTab";
import MeetingTab from "./lead-tabs/MeetingTab";
import CallTab from "./lead-tabs/CallTab";
import EmailTab from "./lead-tabs/EmailTab";
import InvoiceTab from "./lead-tabs/InvoiceTab";
import AddActivityModal from "./lead-tabs/AddActivityModal"; // TAMBAH IMPORT

export function LeadTabs({ lead, onRefresh }: { lead: any; onRefresh: () => void }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      // Cek query param tab
      const urlTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
      if (urlTab) return urlTab;
      return localStorage.getItem("activeLeadTab") || "Activity Timeline";
    }
    return "Activity Timeline";
  });

  // Sync tab dari query param jika berubah
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("activeLeadTab", activeTab);
  }, [activeTab]);
  
  // State untuk semua modal form
  const [showAddActivity, setShowAddActivity] = useState(false); // BARU - untuk Activity Timeline
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showAddCall, setShowAddCall] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track refresh key untuk Activity Timeline
  const [refreshKey, setRefreshKey] = useState(0);
  
  const activityCounts = lead.activityCounts || {
    notes: 0,
    meetings: 0,
    calls: 0,
    emails: 0,
    invoices: 0,
  };

  const tabs = [
    { name: "Activity Timeline", key: "" },
    { name: "Notes", key: "notes" },
    { name: "Meeting", key: "meetings" },
    { name: "Call", key: "calls" },
    { name: "E-mail", key: "emails" },
    { name: "Invoice", key: "invoices" },
  ];

  const getFilterOptions = () => {
    switch (activeTab) {
      case "Activity Timeline":
        return ["ALL", "NOTE", "MEETING", "CALL", "EMAIL", "INVOICE_CREATED"];
      case "Notes":
        return ["ALL", "ATTACHMENT", "TEXT_ONLY"];
      case "Meeting":
        // Fokus pada pengingat atau durasi (berdasarkan skema Meeting)
        return ["ALL", "UPCOMING", "PAST", "HAS_LINK"]; 
      case "Call":
        return ["ALL", "INBOUND", "OUTBOUND"];
      case "E-mail":
        // Berdasarkan status pengiriman di skema Email
        return ["ALL", "SENT", "SCHEDULED", "HAS_ATTACHMENT"];
      case "Invoice":
        return ["ALL", "PAID", "DRAFT", "OVERDUE"];
      default:
        return ["ALL"];
    }
  };

  const getFilterLabel = (type: string) => {
    const labels: Record<string, string> = {
      ALL: "All Activity",
      NOTE: "Notes",
      MEETING: "Meetings",
      CALL: "Calls",
      EMAIL: "E-mails",
      INVOICE_CREATED: "Invoices",
      ATTACHMENT: "Attachment",
      TEXT_ONLY: "Text",
      UPCOMING: "Upcoming",
      PAST: "Past",
      HAS_LINK: "Link",
      SENT: "Sent",
      SCHEDULED: "Scheduled",
      HAS_ATTACHMENT: "Attachment",
      PAID: "Paid",
      DRAFT: "Draft",
      OVERDUE: "Overdue"
    };
    return labels[type] || type.replace("_", " ");
  };

  // Handle Add Activity based on current tab
  const handleAddActivity = () => {
    switch (activeTab) {
      case "Activity Timeline":
        setShowAddActivity(true); // Buka modal Add Activity
        break;
      case "Notes":
        setShowAddNote(true);
        break;
      case "Meeting":
        setShowAddMeeting(true);
        break;
      case "Call":
        setShowAddCall(true);
        break;
      case "E-mail":
        setShowAddEmail(true);
        break;
      case "Invoice":
        setShowAddInvoice(true);
        break;
    }
  };

  // Fungsi untuk mendapatkan label button dinamis
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case "Notes":
        return "Add Note";
      case "Meeting":
        return "Add Meeting";
      case "Call":
        return "Add Call";
      case "E-mail":
        return "Add Email";
      case "Invoice":
        return "Add Invoice";
      case "Activity Timeline":
        return "Add Activity";
      default:
        return "Add Activity";
    }
  };

  // Handler untuk refresh setelah create activity
  const handleActivityCreated = () => {
    setRefreshKey(prev => prev + 1);
    onRefresh();
  };

  const changeTab = (tabName: string) => {
    setActiveTab(tabName);
    setActiveFilter("ALL"); // Reset filter agar tidak terjadi bug antar tab
    setShowFilters(false);  // Menutup panel filter agar tampilan tetap rapat dan bersih
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[600px] md:h-[calc(96.5vh-256.5px)] overflow-hidden">
      
      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity, notes, email, and more..."
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5A4FB5] focus:border-[#5A4FB5] transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex gap-5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const count = tab.key ? activityCounts[tab.key] || 0 : 0;

            return (
              <button
                key={tab.name}
                onClick={() => changeTab(tab.name)}
                className={`relative py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.name
                    ? "text-[#5A4FB5]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1">
                  {tab.name}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      activeTab === tab.name 
                        ? "bg-[#5A4FB5] text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}>
                      {count}
                    </span>
                  )}
                </span>
                {activeTab === tab.name && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A4FB5]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 space-y-3 shrink-0 ">
        {/* Baris Atas: Tombol Filter (Kiri) & Tombol Add (Kanan) */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              showFilters 
                ? "bg-[#5A4FB5] text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <button 
            onClick={handleAddActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#5A4FB5] text-white hover:bg-[#4a3f9f] rounded-md shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getAddButtonLabel()}</span>
          </button>
        </div>

        {/* Baris Bawah: Panel Pilihan Filter (Hanya muncul jika showFilters true) */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-1">
            {getFilterOptions().map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeFilter === type 
                    ? "bg-white dark:bg-gray-700 text-[#5A4FB5] shadow-sm border border-[#5A4FB5]/20" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {getFilterLabel(type)}
            </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {activeTab === "Activity Timeline" && (
          <ActivityTimeline 
            key={refreshKey} 
            leadId={lead.id} 
            onRefresh={onRefresh} 
            filterType={activeFilter} 
            searchQuery={searchQuery}
          />
        )}
        
        {activeTab === "Notes" && (
          <NotesTab 
            leadId={lead.id} 
            showForm={showAddNote} 
            setShowForm={setShowAddNote} 
            onRefresh={onRefresh}
            searchQuery={searchQuery} // Kirim untuk pencarian teks
            filterType={activeFilter}
          />
        )}

        {activeTab === "Meeting" && (
          <MeetingTab 
            leadId={lead.id} 
            showForm={showAddMeeting} 
            setShowForm={setShowAddMeeting}
            onRefresh={onRefresh}
            searchQuery={searchQuery} // Kirim untuk pencarian teks
            filterStatus={activeFilter}
          />
        )}

        {activeTab === "Call" && (
          <CallTab 
            leadId={lead.id} 
            showForm={showAddCall}
            setShowForm={setShowAddCall}
            onRefresh={onRefresh} 
            searchQuery={searchQuery} // Kirim untuk pencarian teks
            filterType={activeFilter}
          />
        )}

        {activeTab === "E-mail" && (
          <EmailTab 
            leadId={lead.id} 
            leadEmail={lead.contact?.email || lead.email}
            showForm={showAddEmail}
            setShowForm={setShowAddEmail}
            onRefresh={onRefresh} 
            searchQuery={searchQuery} // Kirim untuk pencarian teks
            filterType={activeFilter}
          />
        )}

        {activeTab === "Invoice" && (
          <InvoiceTab 
            leadId={lead.id} 
            showForm={showAddInvoice}
            setShowForm={setShowAddInvoice}
            onRefresh={onRefresh} 
            searchQuery={searchQuery} // Kirim untuk pencarian teks
            filterStatus={activeFilter}
          />
        )}
      </div>

      {/* Modal Add Activity - Khusus untuk Activity Timeline */}
      <AddActivityModal
        leadId={lead.id}
        isOpen={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onSuccess={handleActivityCreated}
      />
    </div>
  );
}