"use client";

import { Edit3, Trash2, User, Banknote, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Draggable } from "@hello-pangea/dnd";

// --- Tipe Data Backend ---
type LeadData = {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  company: { name: string } | null;
  owner: { fullName: string; email: string } | null;
  labels: { label: { name: string; colorHex: string | null } }[];
  dueDate: string | null;
  description: string | null;
};

type Props = {
  lead: LeadData;
  index: number;
  selected?: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function LeadCard({ lead, index, selected = false, onClick, onDelete }: Props) {
  const router = useRouter();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lead/${lead.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(lead.id);
  };

  // Format Tanggal (Contoh: 7/7/2025)
  const formattedDate = lead.dueDate
    ? new Date(lead.dueDate).toLocaleDateString("id-ID")
    : "";

  // Format Mata Uang
  const formatCurrency = (val: number | null) => {
    if (!val) return "IDR 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          // Tambahkan style bawaan library (penting untuk animasi drop)
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(lead.id);
          }}
          className={`
            relative group rounded-2xl p-4 mb-3 transition-all cursor-pointer border bg-white dark:bg-gray-800
            ${
              selected
                ? "border-2 border-[#5A4FB5] shadow-md ring-1 ring-[#5A4FB5]/20 dark:ring-[#5A4FB5]/40"
                : "border-gray-200 dark:border-gray-700 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:shadow-md"
            }
            ${snapshot.isDragging ? "shadow-2xl rotate-2 z-50" : ""}
          `}
        >
      {/* === Header: Title + Action Icons === */}
      <div className="flex justify-between items-start mb-1">
            <div className="pr-2">
              <h4 className="text-sm font-bold text-[#2E2E2E] dark:text-white leading-tight line-clamp-2">
                {lead.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                {lead.company?.name || "No Company"}
              </p>
            </div>

            <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:border-[#5A4FB5] dark:hover:border-[#5A4FB5] hover:text-[#5A4FB5] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-400"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all text-gray-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

      {/* === Price + Date Row === */}
      <div className="flex justify-between items-center mt-2 mb-3 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-[#2E2E2E] dark:text-gray-100">
                {formatCurrency(lead.value)}
              </span>
            </div>
            {formattedDate && (
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {formattedDate}
              </span>
            )}
          </div>

      {/* === Tags / Labels Dinamis === */}
      {/* Labels */}
          <div className="flex flex-wrap gap-1 mb-2">
            {lead.labels && lead.labels.length > 0 ? (
              lead.labels.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: item.label.colorHex || "#E5E7EB",
                    color: item.label.colorHex ? "#FFF" : "#374151",
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold truncate max-w-[100px]"
                >
                  {item.label.name}
                </span>
              ))
            ) : (
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                No Label
              </span>
            )}
          </div>

      {/* === Footer: Responsible Team === */}
      <div className="flex items-center gap-2 pt-3 border-t border-dashed border-gray-100 dark:border-gray-700">
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-[10px] font-bold">
              {lead.owner?.fullName ? lead.owner.fullName.charAt(0) : <User size={12} />}
            </div>
            <span className="text-xs font-medium text-[#2E2E2E] dark:text-gray-300 truncate max-w-[150px]">
              {lead.owner?.fullName || "Unassigned"}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}