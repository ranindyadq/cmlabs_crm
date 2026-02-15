import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, checkResourceAccess } from "@/lib/auth-helper";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const memberId = params.id;

    // 🔒 GUNAKAN HELPER
    if (!checkResourceAccess(user, memberId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 1. AMBIL SEMUA LEADS MILIK MEMBER INI
    // ✅ PERBAIKAN: Menggunakan 'ownerId'. 
    // Jika masih merah, coba ganti 'ownerId' menjadi 'userId'
    const allLeads = await prisma.lead.findMany({
      where: { ownerId: memberId }, 
      orderBy: { updatedAt: 'desc' },
      include: { contact: true } 
    });

    // 2. FILTER DATA
    const activeLeads = allLeads.filter(l => l.status !== "WON" && l.status !== "LOST");
    const wonLeads = allLeads.filter(l => l.status === "WON");

    // 3. HITUNG KPI PIPELINE (Active)
    const pipelineValue = activeLeads.reduce((acc, curr) => {
      // Konversi Decimal ke Number agar bisa dijumlahkan
      const val = curr.value ? Number(curr.value) : 0;
      return acc + val;
    }, 0);

    const getProb = (stage: string | null) => {
      // Pastikan logic ini sesuai Enum LeadStage di Prisma
      const s = stage?.toUpperCase() || "";
      switch (s) {
        case "WON": return 100;
        case "CONTRACT_SEND": return 90;
        case "NEGOTIATION": return 80;
        case "PROPOSAL_MADE": return 60;
        case "NEED_IDENTIFIED": return 40;
        case "CONTACT_MADE": return 25;
        case "LEAD_IN": return 10;
        case "LOST": return 0;
        default: return 10;
      }
    };

    const avgProb = activeLeads.length > 0
      ? activeLeads.reduce((acc, curr) => acc + getProb(curr.stage), 0) / activeLeads.length 
      : 0;

    // 4. HITUNG KPI PERFORMANCE (Won)
    const totalRevenue = wonLeads.reduce((acc, curr) => {
      const val = curr.value ? Number(curr.value) : 0;
      return acc + val;
    }, 0);

    const winRate = allLeads.length > 0 
      ? (wonLeads.length / allLeads.length) * 100 
      : 0;
    
    // 5. DATA CHART
    const chartData = getMonthlyChartData(wonLeads);

    // 6. Format Response (Inject probability ke list)
    const activeLeadsWithProb = activeLeads.map(l => ({
      ...l,
      probability: getProb(l.stage),
      value: l.value ? Number(l.value) : 0 
    }));

    return NextResponse.json({
      data: {
        dealsTab: {
          kpis: {
            totalValue: pipelineValue,
            activeDeals: activeLeads.length,
            avgProbability: Math.round(avgProb)
          },
          list: activeLeadsWithProb
        },
        performanceTab: {
          kpis: {
            totalRevenue,
            winRate: Math.round(winRate),
            avgDealSize: wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0,
            dealsClosedCount: wonLeads.length
          },
          chartData
        }
      }
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

// --- HELPER ---
function getMonthlyChartData(wonLeads: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(currentMonth - i);
    const monthIdx = d.getMonth();
    const monthName = months[monthIdx];
    const year = d.getFullYear();

    const leadsInMonth = wonLeads.filter((l: any) => {
      const dateRef = l.closedAt ? new Date(l.closedAt) : new Date(l.updatedAt);
      return dateRef.getMonth() === monthIdx && dateRef.getFullYear() === year;
    });

    const revenue = leadsInMonth.reduce((acc: number, curr: any) => {
      const val = curr.value ? Number(curr.value) : 0;
      return acc + val;
    }, 0);

    result.push({
      month: monthName,
      revenue: revenue,
      target: revenue * 1.2, 
      dealsCount: leadsInMonth.length
    });
  }
  return result;
}