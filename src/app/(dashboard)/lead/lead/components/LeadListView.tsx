"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Building2, Eye, Pencil, Trash2, User, Mail } from "lucide-react";
import { LeadData } from "@/hooks/useLeads";

interface LeadListViewProps {
  leads: LeadData[];
  onDeleteLead?: (leadId: string) => void;
}

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function LeadListView({ leads, onDeleteLead }: LeadListViewProps) {
  const router = useRouter();

  const handleRowClick = (leadId: string) => {
    router.push(`/lead/${leadId}`);
  };

  const handleEdit = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    router.push(`/lead/${leadId}`);
  };

  const handleDelete = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    if (onDeleteLead) {
      onDeleteLead(leadId);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>No leads data yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
          <tr>
            <th className="px-6 py-4 font-medium">Lead Name</th>
            <th className="px-6 py-4 font-medium">Value</th>
            <th className="px-6 py-4 font-medium">Stage</th>
            <th className="px-6 py-4 font-medium">Owner</th>
            <th className="px-6 py-4 font-medium">Contact</th>
            <th className="px-6 py-4 font-medium">Labels</th>
            <th className="px-6 py-4 font-medium">Created</th>
            <th className="px-6 py-4 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {leads.map((lead) => (
            <tr 
              key={lead.id} 
              onClick={() => handleRowClick(lead.id)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
            >
              {/* KOLOM 1: NAMA */}
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {lead.title}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Building2 size={12} />
                  {lead.company?.name || "No Company"}
                </div>
              </td>

              {/* KOLOM 2: VALUE */}
              <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                 {/* Ganti formatCurrency dengan formatter Anda sendiri jika belum ada */}
                 {formatIDR(lead.value || 0)}
              </td>

              {/* KOLOM 3: STAGE (Badge) */}
              <td className="px-6 py-4">
                <span className={`
                  px-2.5 py-1 rounded-full text-xs font-medium border
                  ${lead.stage === 'Won' ? 'bg-green-100 text-green-700 border-green-200' : 
                    lead.stage === 'Lost' ? 'bg-red-100 text-red-700 border-red-200' : 
                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}
                `}>
                  {lead.stage}
                </span>
              </td>

              {/* KOLOM 4: OWNER */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {lead.owner?.fullName?.charAt(0) || "U"}
                   </div>
                   <div>
                     <span className="text-gray-700 dark:text-gray-300 text-sm">{lead.owner?.fullName || '-'}</span>
                     {lead.owner?.email && (
                       <div className="text-xs text-gray-400 flex items-center gap-1">
                         <Mail size={10} />
                         {lead.owner.email}
                       </div>
                     )}
                   </div>
                </div>
              </td>

              {/* KOLOM 5: CONTACT */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   <User size={14} className="text-gray-400" />
                   <span className="text-gray-600 dark:text-gray-400">{lead.contact?.name || '-'}</span>
                </div>
              </td>

              {/* KOLOM 6: LABELS */}
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {lead.labels.length > 0 ? lead.labels.map((l, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        backgroundColor: l.label.colorHex ? `${l.label.colorHex}20` : undefined,
                        color: l.label.colorHex || undefined,
                        borderColor: l.label.colorHex ? `${l.label.colorHex}40` : undefined
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    >
                      {l.label.name}
                    </span>
                  )) : <span className="text-gray-400 text-xs italic">-</span>}
                </div>
              </td>

              {/* KOLOM 7: TANGGAL */}
              <td className="px-6 py-4 text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {lead.createdAt 
                    ? new Date(lead.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : '-'}
                </div>
              </td>

              {/* KOLOM 8: ACTIONS */}
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleEdit(e, lead.id)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View / Edit"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, lead.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}