import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient'; // Pastikan path import ini sesuai

// --- DEFINISI STAGES TETAP (MASTER LIST) ---
export const FIXED_STAGES = [
  { title: "Lead In", slug: "Lead In" },
  { title: "Contact Mode", slug: "Contact Mode" }, // Pastikan slug sesuai string di DB
  { title: "Need Identified", slug: "Need Identified" },
  { title: "Proposal Made", slug: "Proposal Made" },
  { title: "Negotiation", slug: "Negotiation" },
  { title: "Contract Sent", slug: "Contract Sent" },
  { title: "Won", slug: "Won" },
  { title: "Lost", slug: "Lost" },
];

// Definisikan tipe Filter
export interface LeadFilters {
  search?: string;
  picId?: string;
  labelId?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// --- INTERFACE UTAMA LEAD ---
// Export ini agar bisa dipakai di LeadColumn.tsx dan LeadCard.tsx
export interface LeadData {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  
  // Data Relasional
  owner: { fullName: string; email: string } | null;
  contact: { name: string } | null;
  company: { name: string } | null;
  
  // Perhatikan struktur label dari Prisma (nested object)
  labels: { 
    label: { 
      name: string; 
      colorHex: string | null; // colorHex bisa null di DB
    } 
  }[]; 
  
  dueDate: string | null;
  description: string | null;
  createdAt: string | null;
}

type GroupedLeads = Record<string, LeadData[]>;

const useLeads = () => {
    // Backend sekarang mengirimkan data dalam format ini
    const [groupedLeads, setGroupedLeads] = useState<GroupedLeads>({}); 
    const [totalPipelineValue, setTotalPipelineValue] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (filters?: LeadFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            // Konversi object filters ke query string
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);
            if (filters?.picId) params.append('picId', filters.picId);
            if (filters?.labelId) params.append('labelId', filters.labelId);
            if (filters?.source) params.append('source', filters.source);
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);
            if (filters?.status) params.append('status', filters.status);

            // URL ke endpoint Kanban1
            const response = await apiClient.get(`/leads/kanban?${params.toString()}`);
            
            // Backend KANBAN harus mengembalikan:
            // response.data.data -> { "Lead In": [...], "Negotiation": [...] }
            // response.data.totalValues -> { "Lead In": 500000, ... }
            
            setGroupedLeads(response.data.data || {}); 
            setTotalPipelineValue(response.data.totalValues || {});

        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load leads data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch data saat komponen pertama kali di-mount
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return {
        leads: groupedLeads,
        stages: FIXED_STAGES,
        totalValues: totalPipelineValue,
        isLoading,
        error,
        refresh: fetchLeads,
    };
};

export default useLeads;