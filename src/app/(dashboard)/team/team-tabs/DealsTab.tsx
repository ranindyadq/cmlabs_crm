import { useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CircleCheck, 
  Target, 
  Briefcase, 
  Building2
} from "lucide-react";

const getProbabilityByStage = (stageName: string | null) => {
  // Normalisasi ke huruf besar agar cocok dengan case
  const stage = stageName?.toUpperCase() || "";

  switch (stage) {
    case "WON": return 100;
    case "CONTRACT_SEND": return 90;
    case "NEGOTIATION": return 80;
    case "PROPOSAL_MADE": return 60;
    case "NEED_IDENTIFIED": return 40;
    case "CONTACT_MADE": return 25;
    case "LEAD_IN": return 10;
    case "LOST": return 0;
    default: return 10; // Default untuk stage baru/tidak dikenal
  }
};

// --- HELPER 2: WARNA PROGRESS BAR ---
const getProgressBarColor = (prob: number) => {
  if (prob === 100) return "#10b981"; // Hijau Sukses (WON)
  if (prob === 0) return "#9ca3af";   // Abu (LOST)
  if (prob >= 80) return "#11b982";   // Hijau (Hampir Closing)
  if (prob >= 60) return "#5A4FB5";   // Ungu (Brand - Proposal)
  if (prob >= 40) return "#facc15";   // Kuning (Warm)
  return "#ef4444";                   // Merah (Cold)
};

// Format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// 1. Terima Prop 'deals' langsung (Data dari Server)
export default function DealsTab({ deals = [] }: { deals?: any[] }) {

  // 2. Hitung KPI Otomatis dari Data Deals (Tanpa API Call lagi)
  const stats = useMemo(() => {
    if (!deals.length) return null;

    const totalValue = deals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    const activeDeals = deals.length;
    
    // Hitung rata-rata probability
    const totalProb = deals.reduce((acc, curr) => {
        return acc + getProbabilityByStage(curr.stage);
    }, 0);
    
    const avgProbability = Math.round(totalProb / (deals.length || 1));

    return { totalValue, activeDeals, avgProbability };
  }, [deals]);

  if (!deals || deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
        <Briefcase size={40} className="mb-3 opacity-20" />
        <p className="text-sm font-medium">No active deals found for this member.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* === KPI GRID (Dihitung Realtime) === */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Pipeline Value */}
          <div className="p-5 rounded-xl border border-purple-100"
               style={{ backgroundColor: "rgba(126,34,206,0.05)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-[#7e22ce] flex items-center gap-1.5 mb-1">
              <DollarSign size={16} strokeWidth={2.5} />
              Total Pipeline
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatRupiah(stats.totalValue)}
            </div>
          </div>

          {/* Active Deals */}
          <div className="p-5 rounded-xl border border-sky-100"
               style={{ backgroundColor: "rgba(2,132,199,0.05)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0284c7] flex items-center gap-1.5 mb-1">
              <CircleCheck size={16} strokeWidth={2.5} />
              Total Deals
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.activeDeals}
            </div>
          </div>

          {/* Avg Probability */}
          <div className="p-5 rounded-xl border border-emerald-100"
               style={{ backgroundColor: "rgba(17,185,130,0.05)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-[#11b982] flex items-center gap-1.5 mb-1">
              <Target size={16} strokeWidth={2.5} />
              Avg. Probability
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.avgProbability}%
            </div>
          </div>
        </div>
      )}

      {/* === DEAL CARDS LIST === */}
      <div className="space-y-4">
        {deals.map((deal: any) => {
          const probability = getProbabilityByStage(deal.stage);
          const barColor = getProgressBarColor(probability);

          return (
            <div key={deal.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                
                {/* Judul & Info */}
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-lg">{deal.title}</h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                      {/* Ganti underscore dengan spasi agar rapi, misal: LEAD_IN -> LEAD IN */}
                      {deal.stage?.replace(/_/g, " ") || "NEW LEAD"} 
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                     {deal.company ? (
                        <span className="flex items-center gap-1"><Building2 size={14} /> {deal.company.name}</span>
                     ) : (
                        <span className="flex items-center gap-1">🏢 {deal.companyName || "No Company"}</span>
                     )}
                  </p>
                </div>

                {/* Nilai Uang */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatRupiah(Number(deal.value))}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">
                     {deal.currency || "IDR"}
                  </div>
                </div>
              </div>

              {/* Info Tanggal */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar size={14} />
                    <span>Created: {new Date(deal.createdAt).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (Probability) */}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Win Probability</span>
                  <span style={{ color: barColor }}>
                    {probability}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${probability}%`,
                      backgroundColor: barColor
                    }}
                  ></div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}