"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { HiArrowLongLeft } from "react-icons/hi2";
import { Building2, MapPin, Globe, ExternalLink, Users, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadsPage, setLeadsPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const leadsPerPage = 10;

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      apiClient.get(`/companies/${params.id}?leadsPage=${leadsPage}&leadsLimit=${leadsPerPage}`)
        .then(res => {
          setCompany(res.data.data);
          setPagination(res.data.pagination);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id, leadsPage]);

  if (loading) return <div className="p-6 sm:p-10 text-center text-gray-400 dark:text-gray-500 animate-pulse">Loading company details...</div>;
  if (!company) return <div className="p-6 sm:p-10 text-center text-red-500 dark:text-red-400">Company not found.</div>;

  return (
    <div className="p-3 sm:p-2 md:p-2 max-w-6xl mx-auto h-full overflow-y-auto no-scrollbar">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5A4FB5] dark:text-gray-400 dark:hover:text-[#5A4FB5] mb-3 sm:mb-4 transition-colors font-medium"
      >
        <HiArrowLongLeft size={18} /> Back
      </button>

      {/* HEADER with gradient banner */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-4 sm:mb-6">
        {/* Banner with gradient & decorations */}
        <div className="relative w-full h-24 sm:h-32 md:h-36">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5A4FB5] via-[#7B6FD6] to-[#9182F8]"></div>
          
          {/* Decorative shapes */}
          <div className="absolute top-4 left-1/4 w-3 h-3 bg-white/20 rotate-45"></div>
          <div className="absolute top-8 left-1/2 w-2 h-2 bg-white/15 rotate-45"></div>
          <div className="absolute top-6 right-1/3 w-4 h-4 bg-white/10 rotate-45"></div>
          <div className="absolute top-3 right-16 w-6 h-6 border border-white/20 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]"></div>
          <div className="absolute bottom-6 right-1/4 w-10 h-10 border border-white/10 rounded-full"></div>
          <div className="absolute top-4 left-12 w-1 h-1 bg-white/50 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-1/3 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
          
          {/* Soft glow */}
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 blur-3xl rounded-full mix-blend-overlay"></div>
        </div>
      </div>

      {/* Company Info Card - overlapping the banner */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6 -mt-16 sm:-mt-20 relative z-10 mx-2 sm:mx-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Company Logo/Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Building2 size={28} className="sm:w-9 sm:h-9 text-[#5A4FB5]" />
          </div>
          
          {/* Company Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" /> 
                <span className="truncate">{company.address || "No Address"}</span>
              </span>
              {company.website && (
                <a 
                  href={`https://${company.website}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#5A4FB5] hover:text-[#7a6fd6] transition"
                >
                  <Globe size={14} className="flex-shrink-0" /> 
                  <span className="truncate">{company.website}</span>
                  <ExternalLink size={10} className="flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* LEFT: CONTACT PEOPLE */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Users size={16} className="text-[#5A4FB5]" /> 
              Key People
            </h3>
            
            <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {company.contacts && company.contacts.length > 0 ? (
                company.contacts.map((c: any) => (
                  <Link 
                    href={`/contacts/${c.id}`} 
                    key={c.id} 
                    className="flex items-center gap-3 p-2.5 sm:p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-[#5A4FB5]/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group bg-white dark:bg-gray-900/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5A4FB5]/20 text-[#5A4FB5] flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-[#5A4FB5]/30 transition flex-shrink-0">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate group-hover:text-[#5A4FB5] transition">{c.name}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center border border-dashed border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/20">
                  <Users size={18} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 text-xs">No contacts listed.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LEADS */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 min-h-[300px] sm:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase size={16} className="text-[#5A4FB5]" /> 
                Related Leads
              </h3>
              {pagination && pagination.totalLeads > 0 && (
                <span className="text-[10px] sm:text-xs bg-[#5A4FB5]/10 dark:bg-[#5A4FB5]/20 border border-[#5A4FB5]/20 dark:border-[#5A4FB5]/30 text-[#5A4FB5] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                  {pagination.totalLeads} Lead{pagination.totalLeads > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!company.leads || company.leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/20">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                  <Briefcase size={18} className="sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">No leads associated yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3">
                  {company.leads.map((lead: any) => (
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