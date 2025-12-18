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

  // FETCH DATA
  useEffect(() => {
    if (query) {
      setLoading(true);
      apiClient.get(`/global-search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data.data);
        })
        .catch((err) => {
          console.error("Gagal mencari data:", err);
          setResults(null);
        })
        .finally(() => setLoading(false));
    }
  }, [query]);

  return (
    <div className="h-full w-full p-3 overflow-y-auto scrollbar-hide">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#5A4FB5] dark:text-gray-400 dark:hover:text-[#5A4FB5] mb-4 transition font-medium"
        >
          <HiArrowLongLeft size={20} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-[#2E2E2E] dark:text-white flex items-center gap-3">
            Search Results
        </h1>
        
        {query ? (
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Showing results for keyword: <span className="font-semibold text-[#5A4FB5] dark:text-[#7a6fd6]">"{query}"</span>
          </p>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 mt-1">Please enter a keyword to search.</p>
        )}
      </div>

      {/* --- HASIL PENCARIAN --- */}
      {!loading && results && (
        <div className="space-y-8 pb-20">
          
          {/* 1. SECTION: LEADS */}
          {results.leads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Briefcase size={18} className="text-[#5A4FB5] dark:text-[#7a6fd6]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Leads <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{results.leads.length} results</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.leads.map((item: any) => (
                  <Link 
                    href={`/lead/${item.id}`} 
                    key={item.id} 
                    className="group flex flex-col justify-between p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-lg transition-all duration-200"
                  >
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-[#2E2E2E] dark:text-gray-100 text-lg group-hover:text-[#5A4FB5] transition-colors line-clamp-2">{item.title}</p>
                            <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5] flex-shrink-0 ml-2" size={20}/>
                        </div>
                        <div className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-md font-medium mb-3">
                            {item.stage || "No Stage"}
                        </div>
                    </div>
                    
                    {item.value && (
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Value</span>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
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
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <User size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Contacts <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{results.contacts.length} results</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.contacts.map((item: any) => (
                  <Link 
                    href={`/contacts/${item.id}`} 
                    key={item.id} 
                    className="group p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-[#5A4FB5]/10 flex items-center justify-center text-[#5A4FB5] font-bold flex-shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-[#2E2E2E] dark:text-gray-100 truncate group-hover:text-[#5A4FB5] transition-colors">{item.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.email}</p>
                            {item.position && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{item.position}</p>}
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5] flex-shrink-0" size={18}/>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 3. SECTION: COMPANIES */}
          {results.companies.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <Building size={18} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Companies <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{results.companies.length} results</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.companies.map((item: any) => (
                  <Link 
                    href={`/companies/${item.id}`} 
                    key={item.id} 
                    className="group p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                <Building size={20} className="text-gray-400" />
                            </div>
                            <p className="font-bold text-[#2E2E2E] dark:text-gray-100 group-hover:text-[#5A4FB5] transition-colors">{item.name}</p>
                        </div>
                        <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-[#5A4FB5]" size={18}/>
                    </div>
                    {item.website && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg w-fit">
                            <ExternalLink size={14} />
                            <span className="truncate max-w-[200px]">{item.website}</span>
                        </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* EMPTY STATE */}
          {results.leads.length === 0 && results.contacts.length === 0 && results.companies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <SearchIcon size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No results found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                We couldn't find anything matching "<span className="font-medium text-gray-900 dark:text-gray-100">{query}</span>". Try using broader keywords or check for typos.
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