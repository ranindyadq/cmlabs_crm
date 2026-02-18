"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { HiArrowLongLeft } from "react-icons/hi2"; 
import { Briefcase, User, Building, ChevronRight, ExternalLink, Search as SearchIcon, Loader2 } from "lucide-react"; 
import apiClient from "@/lib/apiClient";
import Link from "next/link";

// Tipe Data Hasil Pencarian
interface SearchResults {
  leads: any[];
  contacts: any[];
  companies: any[];
}

function GlobalSearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const router = useRouter();

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    if (query) {
      setLoading(true);
      setError(null);
      apiClient.get(`/global-search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data.data);
        })
        .catch((err) => {
          console.error("Failed to fetch data:", err);
          setResults(null);
          setError("Failed to fetch search results. Please try again later.");
        })
        .finally(() => setLoading(false));
    }
  }, [query]);

  return (
    <div className="h-full w-full p-2 overflow-y-auto no-scrollbar">
      
      {/* --- HEADER --- */}
      <div className="mb-4 sm:mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5A4FB5] dark:text-gray-400 dark:hover:text-[#5A4FB5] mb-3 transition font-medium"
        >
          <HiArrowLongLeft size={18} />
          Back
        </button>

        <h1 className="text-lg sm:text-xl font-semibold text-[#2E2E2E] dark:text-white">
          Search Results
        </h1>
        
        {query ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Results for: <span className="font-semibold text-[#5A4FB5] dark:text-[#7a6fd6]">{query}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please enter a keyword to search.</p>
        )}
      </div>

      {/* --- SEARCH RESULTS --- */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      {!loading && results && !error && (
        <div className="space-y-5 sm:space-y-6 pb-10">
          
          {/* 1. SECTION: LEADS */}
          {results.leads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Briefcase size={16} className="text-[#5A4FB5] dark:text-[#7a6fd6]" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Leads <span className="ml-1.5 text-[10px] sm:text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 rounded-full">{results.leads.length}</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {results.leads.map((item: any) => (
                  <Link 
                    href={`/lead/${item.id}`} 
                    key={item.id} 
                    className="group flex flex-col justify-between p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md transition-all duration-200"
                  >
                    <div>
                        <div className="flex justify-between items-start mb-1.5">
                            <p className="font-semibold text-[#2E2E2E] dark:text-gray-100 text-sm sm:text-base group-hover:text-[#5A4FB5] transition-colors line-clamp-2">{item.title}</p>
                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5] flex-shrink-0 ml-2" size={16}/>
                        </div>
                        <div className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-medium">
                            {item.stage || "No Stage"}
                        </div>
                    </div>
                    
                    {item.value && (
                        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <span className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">Value</span>
                            <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                IDR {Number(item.value).toLocaleString('id-ID')}
                            </p>
                        </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. SECTION: CONTACTS */}
          {results.contacts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1 sm:p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <User size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Contacts <span className="ml-1.5 text-[10px] sm:text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 rounded-full">{results.contacts.length}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {results.contacts.map((item: any) => (
                  <Link 
                    href={`/contacts/${item.id}`} 
                    key={item.id} 
                    className="group p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#5A4FB5]/10 flex items-center justify-center text-[#5A4FB5] text-sm sm:text-base font-bold flex-shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-[#2E2E2E] dark:text-gray-100 truncate group-hover:text-[#5A4FB5] transition-colors">{item.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{item.email}</p>
                            {item.position && <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{item.position}</p>}
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5] flex-shrink-0" size={16}/>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 3. SECTION: COMPANIES */}
          {results.companies.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1 sm:p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <Building size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                  Companies <span className="ml-1.5 text-[10px] sm:text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 rounded-full">{results.companies.length}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {results.companies.map((item: any) => (
                  <Link 
                    href={`/companies/${item.id}`} 
                    key={item.id} 
                    className="group p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                <Building size={16} className="text-gray-400" />
                            </div>
                            <p className="font-semibold text-sm sm:text-base text-[#2E2E2E] dark:text-gray-100 group-hover:text-[#5A4FB5] transition-colors">{item.name}</p>
                        </div>
                        <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5]" size={16}/>
                    </div>
                    {item.website && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg w-fit">
                            <ExternalLink size={12} />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{item.website}</span>
                        </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* EMPTY STATE */}
          {results.leads.length === 0 && results.contacts.length === 0 && results.companies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center px-4">
              <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                <SearchIcon size={28} className="sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">No results found</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-sm">
                No matches for <span className="font-medium text-gray-900 dark:text-gray-100">{query}</span>. Try broader keywords.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading search...</div>}>
       <GlobalSearchContent />
    </Suspense>
  );
}