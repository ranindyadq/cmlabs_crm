"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trophy, 
  XCircle, 
  Calendar, 
  Building2, 
  User, 
  Search,
  Filter,
  Eye,
  RotateCcw
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ArchivedLead {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  status: string;
  closedAt: string | null;
  createdAt: string;
  owner: { fullName: string } | null;
  contact: { name: string } | null;
  company: { name: string } | null;
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function ArchivePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<ArchivedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "won" | "lost">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch archived leads (Won/Lost)
  const fetchArchivedLeads = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/leads", {
        params: { view: "archived" }
      });
      setLeads(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch archived leads:", error);
      toast.error("Failed to load archived leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedLeads();
  }, []);

  // Filter and search
  const filteredLeads = leads.filter(lead => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "won" && lead.status === "WON") || 
      (filter === "lost" && lead.status === "LOST");
    
    const matchesSearch = 
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Stats
  const wonCount = leads.filter(l => l.status === "WON").length;
  const lostCount = leads.filter(l => l.status === "LOST").length;
  const wonValue = leads.filter(l => l.status === "WON").reduce((sum, l) => sum + (l.value || 0), 0);
  const lostValue = leads.filter(l => l.status === "LOST").reduce((sum, l) => sum + (l.value || 0), 0);

  // Restore lead to Active
  const handleRestore = async (leadId: string) => {
    try {
      await apiClient.patch(`/leads/${leadId}`, { 
        status: "ACTIVE",
        stage: "Lead In"
      });
      toast.success("Lead restored to active");
      fetchArchivedLeads();
    } catch (error) {
      toast.error("Failed to restore lead");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/lead")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Archived Leads
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              View all completed deals (Won & Lost)
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Trophy size={18} />
            <span className="text-sm font-medium">Won Deals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{wonCount}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Trophy size={18} />
            <span className="text-sm font-medium">Won Value</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatIDR(wonValue)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <XCircle size={18} />
            <span className="text-sm font-medium">Lost Deals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{lostCount}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <XCircle size={18} />
            <span className="text-sm font-medium">Lost Value</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatIDR(lostValue)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search archived leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === "all" 
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            All ({leads.length})
          </button>
          <button
            onClick={() => setFilter("won")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
              filter === "won" 
                ? "bg-green-100 text-green-700 shadow-sm" 
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <Trophy size={14} /> Won ({wonCount})
          </button>
          <button
            onClick={() => setFilter("lost")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
              filter === "lost" 
                ? "bg-red-100 text-red-700 shadow-sm" 
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <XCircle size={14} /> Lost ({lostCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A4FB5]"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Trophy size={48} className="mb-3 text-gray-300" />
            <p className="text-lg font-medium">No archived leads found</p>
            <p className="text-sm">Leads marked as Won or Lost will appear here</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Lead Name</th>
                  <th className="px-6 py-4 font-medium">Value</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {lead.title}
                      </div>
                      {lead.contact && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User size={12} />
                          {lead.contact.name}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {formatIDR(lead.value || 0)}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`
                        px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1
                        ${lead.status === 'WON' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'}
                      `}>
                        {lead.status === 'WON' ? <Trophy size={12} /> : <XCircle size={12} />}
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        {lead.owner?.fullName || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Building2 size={14} />
                        {lead.company?.name || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/lead/${lead.id}`)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleRestore(lead.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          title="Restore to Active"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
