import { useEffect, useState } from "react"; 
import { Calendar, Clock, DollarSign, CircleCheck, Target, Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";

// 1. Terima Prop memberId
export default function DealsTab({ memberId }: { memberId: string }) {
  // 2. State untuk Data Dinamis
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // 3. Fetch Data saat memberId berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/team/${memberId}/stats`);
        setData(res.data.data.dealsTab); // Ambil bagian dealsTab dari API
      } catch (error) {
        console.error("Failed to fetch deals stats", error);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) fetchData();
  }, [memberId]);

  // 4. Loading State
  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#5A4FB5]" /></div>;
  
  // 5. Jika data kosong
  if (!data) return <div className="p-5 text-gray-500">No active deals found.</div>;

  // Destructure data dari API
  const { kpis, list } = data;

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Pipeline Value */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(126,34,206,0.12)" }}>
          <div className="text-small font-medium text-[#7e22ce] flex items-center gap-1">
            <DollarSign size={18} strokeWidth={1.8} />
            Total Pipeline Value
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            Rp {kpis.totalValue.toLocaleString("id-ID")}
          </div>
        </div>

        {/* Active Deals */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(2,132,199,0.12)" }}>
          <div className="text-small font-medium text-[#0284c7] flex items-center gap-1">
            <CircleCheck size={18} strokeWidth={1.8} />
            Active Deals
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {kpis.activeDeals}
          </div>
        </div>

        {/* Avg Probability */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(17,185,130,0.12)" }}>
          <div className="text-small font-medium text-[#11b982] flex items-center gap-1">
            <Target size={18} strokeWidth={1.8} />
            Avg. Probability
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {kpis.avgProbability}%
          </div>
        </div>
      </div>

      {/* DEAL CARDS */}
      <div className="space-y-4">
        {/* Cek jika list kosong */}
        {list.length === 0 && <p className="text-gray-500 text-center py-10">No active deals currently.</p>}
        
        {list.map((deal: any) => (
          <div key={deal.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* BAGIAN ATAS CARD (JUDUL & HARGA) */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    {deal.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  Contact: {deal.contact?.name || "Unknown"}
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  Rp {deal.value.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-gray-500">
                  {deal.probability}% probability
                </div>
              </div>
            </div>

            {/* BAGIAN BAWAH CARD (TANGGAL) - Pastikan ini DI DALAM card */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>Created: {new Date(deal.createdAt).toLocaleDateString("id-ID")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Updated: {new Date(deal.updatedAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>

            {/* PROGRESS BAR - Pastikan ini DI DALAM card */}
            <div className="mt-4">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${deal.probability || 0}%` }}
                ></div>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}