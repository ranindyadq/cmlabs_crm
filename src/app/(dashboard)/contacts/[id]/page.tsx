"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { HiArrowLongLeft } from "react-icons/hi2";
import { Mail, Phone, Briefcase, MapPin, Building, Edit, User, Plus } from "lucide-react";
import Link from "next/link";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      apiClient.get(`/contacts/${params.id}`)
        .then(res => setContact(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="p-10 text-center text-gray-400 animate-pulse">Loading profile...</div>;
  if (!contact) return <div className="p-10 text-center text-red-400">Contact not found.</div>;

  // Initials for Avatar
  const initials = contact.name
    ? contact.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2).toUpperCase()
    : "??";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
      >
        <HiArrowLongLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to List
      </button>
      
      {/* HEADER CARD */}
      <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#5A4FB5]/20 flex items-center justify-center text-[#5A4FB5] text-2xl font-bold border border-[#5A4FB5]/30 shadow-lg shadow-[#5A4FB5]/10">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{contact.name}</h1>
            <div className="text-gray-400 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                <Briefcase size={14} className="text-gray-500" /> {contact.position || "No Position"}
              </span>
              {contact.company && (
                <>
                  <span className="text-gray-600">•</span>
                  <Link href={`/companies/${contact.company.id}`} className="text-[#5A4FB5] hover:text-[#7a6fd6] hover:underline flex items-center gap-1 transition">
                    <Building size={14} /> {contact.company.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition">
            <Edit size={16} /> Edit
          </button>
          <a 
            href={`mailto:${contact.email}`} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#5A4FB5] text-white rounded-lg text-sm font-medium hover:bg-[#4a4194] transition shadow-lg shadow-[#5A4FB5]/20"
          >
            <Mail size={16} /> Send Email
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INFO DETAIL */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3">Contact Info</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="bg-gray-800 p-2.5 rounded-lg text-gray-400 group-hover:text-[#5A4FB5] transition-colors">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-sm text-gray-200 break-all">{contact.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="bg-gray-800 p-2.5 rounded-lg text-gray-400 group-hover:text-[#5A4FB5] transition-colors">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-sm text-gray-200">{contact.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="bg-gray-800 p-2.5 rounded-lg text-gray-400 group-hover:text-[#5A4FB5] transition-colors">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-sm text-gray-200">Jakarta, Indonesia</p> {/* Placeholder */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RELATED ITEMS (History/Leads) */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-800 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Leads & Deals</h3>
              <span className="text-xs bg-green-900/30 border border-green-800 text-green-400 px-3 py-1 rounded-full font-medium">
                Active
              </span>
            </div>

            {/* Empty State / List */}
            {!contact.leads || contact.leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-xl bg-gray-800/20">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                   <Briefcase size={20} className="text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium text-sm">No leads associated yet.</p>
                <button className="mt-4 flex items-center gap-2 text-sm text-[#5A4FB5] font-semibold hover:text-[#7a6fd6] transition">
                  <Plus size={16} /> Create New Lead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contact.leads.map((lead: any) => (
                  <Link 
                    href={`/lead/${lead.id}`} 
                    key={lead.id} 
                    className="block p-4 border border-gray-800 bg-gray-800/30 rounded-xl hover:border-[#5A4FB5]/50 hover:bg-gray-800 transition group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-200 group-hover:text-[#5A4FB5] transition">{lead.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Value: <span className="text-gray-300">IDR {Number(lead.value).toLocaleString()}</span></p>
                      </div>
                      <span className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded-md text-gray-300 font-medium">
                        {lead.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}