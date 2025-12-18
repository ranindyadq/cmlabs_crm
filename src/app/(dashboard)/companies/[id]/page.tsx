"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { HiArrowLongLeft } from "react-icons/hi2";
import { Building2, MapPin, Globe, ExternalLink, Users, Phone, Mail, Plus } from "lucide-react";
import Link from "next/link";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      apiClient.get(`/companies/${params.id}`)
        .then(res => setCompany(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Loading company details...</div>;
  if (!company) return <div className="p-10 text-center text-red-400">Company not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
      >
        <HiArrowLongLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to List
      </button>
      
      {/* COMPANY HEADER */}
      <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden mb-6">
        {/* Banner with gradient */}
        <div className="h-32 bg-gradient-to-r from-gray-800 via-gray-800 to-[#5A4FB5]/20 relative">
          <div className="absolute -bottom-10 left-8 p-1 bg-gray-900 rounded-xl shadow-lg border border-gray-800">
            <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
              <Building2 size={32} className="text-[#5A4FB5]" />
            </div>
          </div>
        </div>
        
        <div className="pt-12 px-8 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-gray-500" /> 
                {company.address || "No Address"}
              </span>
              {company.website && (
                <a 
                  href={`https://${company.website}`} 
                  target="_blank" 
                  className="flex items-center gap-1 text-[#5A4FB5] hover:text-[#7a6fd6] transition"
                >
                  <Globe size={14} /> {company.website} <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5A4FB5] hover:bg-[#4a4194] text-white rounded-lg text-sm font-medium transition shadow-lg shadow-[#5A4FB5]/20">
            <Plus size={16} /> Add New Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: COMPANY DETAILS */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">About</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {company.description || "No description provided for this company."}
            </p>
            
            <div className="mt-6 space-y-3 pt-6 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Industry</span>
                <span className="font-medium text-gray-200">Technology</span> {/* Placeholder */}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Employees</span>
                <span className="font-medium text-gray-200">50-100</span> {/* Placeholder */}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Founded</span>
                <span className="font-medium text-gray-200">2018</span> {/* Placeholder */}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: CONTACT PEOPLE (EMPLOYEES) */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={20} className="text-[#5A4FB5]" /> 
                Key People <span className="text-gray-500 text-sm font-normal">({company.contacts?.length || 0})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.contacts && company.contacts.length > 0 ? (
                company.contacts.map((c: any) => (
                  <Link 
                    href={`/contacts/${c.id}`} 
                    key={c.id} 
                    className="flex items-center gap-4 p-4 border border-gray-800 rounded-xl hover:border-[#5A4FB5]/50 hover:bg-gray-800/50 transition group bg-gray-900/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#5A4FB5]/20 text-[#5A4FB5] flex items-center justify-center font-bold text-sm ring-2 ring-transparent group-hover:ring-[#5A4FB5]/30 transition">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-gray-200 truncate group-hover:text-[#5A4FB5] transition">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.position || "No Position"}</p>
                      <div className="flex gap-3 mt-2">
                        {c.email && <Mail size={14} className="text-gray-600 hover:text-gray-300 transition" />}
                        {c.phone && <Phone size={14} className="text-gray-600 hover:text-gray-300 transition" />}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center border border-dashed border-gray-800 rounded-xl bg-gray-800/20">
                   <p className="text-gray-500 text-sm">No contacts listed for this company.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}