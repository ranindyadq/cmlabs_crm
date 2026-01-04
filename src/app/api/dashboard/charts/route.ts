import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 2. Ambil Query Params
    const { searchParams } = new URL(req.url);

    const picIdParam = searchParams.get("picId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const source = searchParams.get("source");
    const status = searchParams.get("status");

    // Tentukan Start & End Date dulu sebelum query
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
        // Jika User pilih custom date (misal: 2025)
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999); // Mentokkan ke akhir hari
    } else {
        // Default: 12 Bulan Terakhir dari SEKARANG
        // (Agar chart nyambung dari 2025 ke 2026)
        endDate = new Date();
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11); // Mundur 11 bulan
        startDate.setDate(1); 
    }

    // 3. Buat Filter Kondisi
    const whereCondition: any = {
      deletedAt: null,
    };

    if (user.role === 'ADMIN') {
      if (picIdParam) whereCondition.ownerId = picIdParam;
    } else {
      whereCondition.ownerId = user.id;
    }

    if (source) whereCondition.sourceOrigin = source;
    if (status) whereCondition.status = status;

    whereCondition.createdAt = {
       gte: startDate,
       lte: endDate,
    };

    // 4. FETCH DATA (Cukup 1x Query untuk semua Chart)
    // Kita pakai findMany agar bisa menghitung Value (Revenue) dan Source sekaligus.
    const leads = await prisma.lead.findMany({
      where: whereCondition,
      select: {
        id: true,
        createdAt: true,
        value: true,
        status: true,
        stage: true,
        sourceOrigin: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // 5. DATA PROCESSING: Normalisasi 12 Bulan (Jan - Dec)
    const allMonths: string[] = [];
    let current = new Date(startDate);
    current.setDate(1); // Set tanggal 1 biar looping bulan aman
    
    // Loop dari Start sampai End untuk bikin label (misal: "Jan 2025", "Feb 2025")
    while (current <= endDate) {
        const label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        allMonths.push(label);
        current.setMonth(current.getMonth() + 1);
    }

    // Mapping Data ke Bulan-Bulan Tersebut
    const monthlyStats = allMonths.map((monthLabel) => {
      // Filter leads yang label bulannya COCOK dengan label di chart
      const leadsInThisMonth = leads.filter(l => {
        const d = new Date(l.createdAt);
        const leadLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return leadLabel === monthLabel;
      });

      // (LOGIC HITUNG DI BAWAH INI SAMA PERSIS DENGAN KODE LAMA ANDA)
      const count = leadsInThisMonth.length;
      const estimation = leadsInThisMonth.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
      const realisation = leadsInThisMonth
        .filter(l => l.status === 'WON')
        .reduce((acc, curr) => acc + Number(curr.value || 0), 0);

      return {
        month: monthLabel,
        count,
        estimation,
        realisation
      };
    });

    // Pisahkan hasil (SAMA)
    const leadsByMonth = monthlyStats.map(m => ({ 
      month: m.month, 
      count: m.count 
    }));

    const revenueTrend = monthlyStats.map(m => ({
      month: m.month,
      estimation: m.estimation,
      realisation: m.realisation
    }));

    // 6. PIPELINE OVERVIEW (Group by Stage)
    // Hitung dari data 'leads' yang sudah diambil
    const stageCounts: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.status === 'ACTIVE') { // Biasanya pipeline hanya menghitung yang Aktif
         const stage = lead.stage || 'Unassigned';
         stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }
    });

    const pipelineOverview = Object.keys(stageCounts).map(stage => ({
      stage,
      count: stageCounts[stage]
    }));

    // 7. SOURCE BREAKDOWN (Group by Source)
    const sourceCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const src = lead.sourceOrigin || 'Unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const sourceBreakdown = Object.keys(sourceCounts).map(name => ({
      name,
      value: sourceCounts[name]
    }));

    // 8. Return Response
    return NextResponse.json({
      success: true,
      data: {
        leadsByMonth,      // ✅ Full 12 Bulan
        revenueTrend,      // ✅ Full 12 Bulan (Estimation vs Realisation)
        sourceBreakdown,   // ✅ Pie Chart Data
        pipelineOverview   // ✅ Funnel Data
      }
    });

  } catch (error: any) {
    console.error("[Dashboard Charts API Error]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}