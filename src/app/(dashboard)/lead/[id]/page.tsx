"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import LeadDetail from "../components/LeadDetail";
import { useParams } from "next/navigation";

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // FETCH DATA LEAD UTAMA
  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${id}`);
      setLead(res.data.data);
    } catch (error) {
      console.error("Gagal ambil detail lead:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Lead...</div>;
  if (!lead) return <div className="p-8 text-center text-red-500 dark:text-red-400">Lead not found.</div>;

  return (
    // Kita passing fungsi refresh agar child component bisa trigger update data
    <LeadDetail lead={lead} onRefresh={fetchLead} />
  );
}