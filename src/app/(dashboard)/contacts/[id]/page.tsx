"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { HiArrowLongLeft } from "react-icons/hi2";
import { Mail, Phone, Briefcase, Building, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadsPage, setLeadsPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const leadsPerPage = 10;

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      apiClient.get(`/contacts/${params.id}?leadsPage=${leadsPage}&leadsLimit=${leadsPerPage}`)
        .then(res => {
          setContact(res.data.data);
          setPagination(res.data.pagination);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id, leadsPage]);

  if (loading) return <div className="p-6 sm:p-10 text-center text-gray-400 dark:text-gray-500 animate-pulse">Loading profile...</div>;
  if (!contact) return <div className="p-6 sm:p-10 text-center text-red-500 dark:text-red-400">Contact not found.</div>;

  // Initials for Avatar
  const initials = contact.name
    ? contact.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2).toUpperCase()
    : "??";

  return (
    <div className="p-2 sm:p-2 md:p-2 h-full overflow-y-auto no-scrollbar">
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5A4FB5] dark:text-gray-400 dark:hover:text-[#5A4FB5] mb-3 sm:mb-4 transition-colors font-medium"
      >
        <HiArrowLongLeft size={18} /> Back
      </button>
      
      {/* HEADER CARD */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#5A4FB5]/20 flex items-center justify-center text-[#5A4FB5] text-lg sm:text-2xl font-bold border border-[#5A4FB5]/30 shadow-lg shadow-[#5A4FB5]/10">
            {initials}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{contact.name}</h1>
            <div className="text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <Briefcase size={14} className="text-gray-500" /> {contact.position || "No Position"}
              </span>
              {contact.company && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Link href={`/companies/${contact.company.id}`} className="text-[#5A4FB5] hover:text-[#7a6fd6] hover:underline flex items-center gap-1 transition">
                    <Building size={14} /> {contact.company.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
          <a 
            href={`mailto:${contact.email}`} 
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#5A4FB5] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#4a4194] transition shadow-md shadow-[#5A4FB5]/20"
          >
            <Mail size={14} className="sm:w-4 sm:h-4" /> Email
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN: INFO DETAIL */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 sm:pb-3">Contact Info</h3>
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-start gap-3 sm:gap-4 group">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-2.5 rounded-lg text-gray-500 dark:text-gray-400 group-hover:text-[#5A4FB5] transition-colors">
                  <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 break-all">{contact.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4 group">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-2.5 rounded-lg text-gray-500 dark:text-gray-400 group-hover:text-[#5A4FB5] transition-colors">
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">{contact.phone || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RELATED ITEMS (History/Leads) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[300px] sm:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Recent Leads & Deals</h3>
              {pagination && pagination.totalLeads > 0 && (
                <span className="text-[10px] sm:text-xs bg-[#5A4FB5]/10 dark:bg-[#5A4FB5]/20 border border-[#5A4FB5]/20 dark:border-[#5A4FB5]/30 text-[#5A4FB5] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                  {pagination.totalLeads} Lead{pagination.totalLeads > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Empty State / List */}
            {!contact.leads || contact.leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                   <Briefcase size={18} className="sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">No leads associated yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {contact.leads.map((lead: any) => (
                    <Link 
                      href={`/lead/${lead.id}`} 
                      key={lead.id} 
                      className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-xl hover:border-[#5A4FB5]/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200 group-hover:text-[#5A4FB5] transition">{lead.title}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Value: <span className="text-gray-600 dark:text-gray-300">IDR {Number(lead.value).toLocaleString()}</span></p>
                        </div>
                        <span className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-gray-600 dark:text-gray-300 font-medium">
                          {lead.stage}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLeadsPage(prev => Math.max(1, prev - 1))}
                        disabled={leadsPage === 1}
                        className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setLeadsPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={leadsPage === pagination.totalPages}
                        className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}