"use client";

import { Plus } from "lucide-react";
import LeadCard from "./LeadCard";
import { Droppable } from "@hello-pangea/dnd";

interface LeadData {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  owner: { fullName: string; email: string } | null;
  company: { name: string } | null;
  labels: { label: { name: string; colorHex: string | null } }[];
  dueDate: string | null;
  description: string | null;
}

interface LeadColumnProps {
  title: string;
  stageId: string;
  amount: number;
  leads: number;
  onAdd: () => void;
  onSelectCard: (id: string) => void;
  selectedId: string | null;
  stageLeads: LeadData[];
  onDeleteCard: (id: string) => void;
  columnIndex?: number;
}

export default function LeadColumn({
  title,
  stageId,
  amount,
  leads,
  onAdd,
  onSelectCard,
  selectedId,
  stageLeads,
  onDeleteCard,
  columnIndex = 0,
}: LeadColumnProps) {
  return (
    <div className="flex flex-col flex-shrink-0 w-72 bg-[#5A4FB5]/10 dark:bg-gray-800/50 rounded-2xl px-3 pb-3 pt-0 min-h-[600px] transition-colors">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm mb-3 mt-3 transition-colors">
        <div>
          <h3 className="font-bold text-[#2E2E2E] dark:text-white text-sm">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            IDR {Number(amount).toLocaleString("id-ID")} · {leads} Leads
          </p>
        </div>
        <button
          onClick={onAdd}
          className="bg-[#5A4FB5] text-white p-1.5 rounded-full hover:bg-[#4B42A8] transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      <Droppable droppableId={stageId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-1 overflow-y-auto flex-1 min-h-[100px] transition-colors rounded-xl  ${
              snapshot.isDraggingOver
                ? "bg-purple-100/50 dark:bg-purple-900/20"
                : ""
            }`}
          >
            {stageLeads.length > 0 ? (
              stageLeads.map((lead, index) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  index={index}
                  selected={selectedId === lead.id}
                  onClick={() => onSelectCard(lead.id)}
                  onDelete={onDeleteCard}
                />
              ))
            ) : (
              !snapshot.isDraggingOver && (
                <div className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                  No Leads
                </div>
              )
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}