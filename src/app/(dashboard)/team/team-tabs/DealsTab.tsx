import { useEffect, useState } from "react"; 
import { Calendar, Clock, DollarSign, CircleCheck, Target, Loader2, Building2, User } from "lucide-react";
import apiClient from "@/lib/apiClient";

// 1. Terima Prop memberId
export default function DealsTab({ memberId }: { memberId: string }) {
  // 2. State untuk Data Dinamis
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const getProgressBarColor = (prob: number) => {
  if (prob >= 80) return "#11b982"; // Hijau (Lime/Success) - Hampir Closing
  if (prob >= 50) return "#5A4FB5"; // Palm Purple (Brand Color) - Peluang Bagus
  if (prob >= 30) return "#facc15"; // Kuning - Sedang berproses
  return "#ef4444";               // Merah - Masih sangat awal (Cold)
};

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
        {list.map((deal: any) => (
          <div key={deal.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  {/* Tampilkan Stage sebagai badge */}
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {deal.status.replace("_", " ")} 
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                   {deal.companyName && deal.companyName !== "Perorangan" 
                    ? `🏢 ${deal.companyName}` 
                    : `👤 ${deal.contactName || "Unknown"}`}
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
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="text-gray-500 uppercase tracking-wider">Probability</span>
                <span style={{ color: getProgressBarColor(deal.probability) }}>
                  {deal.probability}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 transition-all duration-500 ease-out"
                  style={{ 
                    width: `${deal.probability || 0}%`,
                    backgroundColor: getProgressBarColor(deal.probability) // ✅ Panggil Fungsi Warna
                  }}
                ></div>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}