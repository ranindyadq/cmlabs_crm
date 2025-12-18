import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// HELPER: Hitung Pertumbuhan (Growth)
const calcGrowth = (curr: number, last: number) => {
  if (last === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - last) / last) * 100);
};

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    const { searchParams } = new URL(req.url);
    const picId = searchParams.get('picId');
    const source = searchParams.get('source');
    const status = searchParams.get('status'); // 🔥 TANGKAP STATUS
    const startDate = searchParams.get('startDate'); // 🔥 TANGKAP TANGGAL
    const endDate = searchParams.get('endDate');   // 🔥 TANGKAP TANGGAL

    // Tentukan Periode Waktu (Fallback: Bulan Ini)
    let currentStart: Date;
    let currentEnd: Date;
    let lastStart: Date;
    let lastEnd: Date;
    
    // Jika ada filter tanggal dari Frontend (custom, monthly, quarterly)
    if (startDate && endDate) {
        currentStart = new Date(startDate);
        currentEnd = new Date(endDate);
        
        // Logika Last Period (Jika filter diberikan, kita hitung periode sebelumnya)
        // Ini kompleks, untuk simplifikasi kita asumsikan jika custom date range, 
        // kita hanya tampilkan data CURRENT tanpa perbandingan MoM/QoQ. 
        // Agar MoM/QoQ tetap berfungsi, kita harus tahu panjang periode.
        
        // --- Simplifikasi untuk MoM/QoQ (Jika tidak pakai custom date) ---
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Jika filter tanggal KOSONG (berarti default 'monthly' dari frontend):
        if (startDate === startOfMonth.toISOString().split('T')[0]) {
            currentStart = startOfMonth;
            currentEnd = now;
            lastStart = startOfLastMonth;
            lastEnd = startOfMonth;
        } else {
             // Jika custom date range, matikan perbandingan MoM/QoQ
             currentStart = new Date(startDate);
             currentEnd = new Date(endDate);
             lastStart = currentStart; // 🔥 Set Last = Current untuk hasil pertumbuhan 0%
             lastEnd = currentEnd;
        }

    } else {
        // Default: Bulan Ini vs Bulan Lalu
        const now = new Date();
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Filter Dasar
    const baseWhere: any = { deletedAt: null };
    if (picId) baseWhere.ownerId = picId;
    if (source) baseWhere.sourceOrigin = source;
    // 🔥 Terapkan filter status jika ada (Hanya untuk Active Deals dan Total Leads)
    if (status && status !== 'WON' && status !== 'LOST') {
        // Status 'ACTIVE' adalah gabungan dari semua status non-WON/LOST
        // Kita tidak bisa filter status di sini karena akan merusak hitungan WON/LOST.
        // Kita biarkan filter status diterapkan secara spesifik di Aggregates di bawah.
    }

    // --- QUERY HELPER ---
    const getPeriodStats = async (from: Date, to: Date) => {
        const dateFilter = { gte: from, lt: to };
        
        const [totalLeads, totalWon, totalLost, activeAggregate, wonAggregate] = await prisma.$transaction([
            // 1. TOTAL LEADS (Filter berdasarkan TANGGAL PEMBUATAN)
            prisma.lead.count({ where: { 
                ...baseWhere, 
                createdAt: dateFilter,
                // 🔥 Terapkan filter status di sini jika diperlukan (misal Status NEW/HOT/WARM)
                ...(status ? { status: status } : {}) 
            } }), 
            
            // 2. TOTAL WON (Filter berdasarkan TANGGAL CLOSING)
            prisma.lead.count({ where: { 
                ...baseWhere, 
                status: 'WON', 
                closedAt: dateFilter,
                // Kita tidak bisa filter status di sini karena status SUDAH WON
            } }), 
            
            // 3. TOTAL LOST (Filter berdasarkan TANGGAL CLOSING)
            prisma.lead.count({ where: { ...baseWhere, status: 'LOST', closedAt: dateFilter } }), 
            
            // 4. Active Pipeline (Snapshot - Jangan pakai dateFilter kecuali diminta spesifik)
            prisma.lead.aggregate({
                _sum: { value: true },
                _count: { id: true },
                where: { 
                    ...baseWhere, 
                    status: { notIn: ['WON', 'LOST'] }, 
                    // createdAt: dateFilter,  <-- HAPUS INI agar menampilkan total pipeline eksisting
                    
                    // Opsional: Jika ingin filter tanggal tetap berlaku, ganti label di UI jadi "New Pipeline"
                }
            }),

            // 5. Revenue (Status Won, filter TANGGAL CLOSING)
            prisma.lead.aggregate({
                _sum: { value: true },
                _avg: { value: true },
                where: { ...baseWhere, status: 'WON', closedAt: dateFilter }
            })
        ]);

        return {
          totalLeads, totalWon, totalLost,
          pipelineValue: Number(activeAggregate._sum.value || 0),
          activeCount: activeAggregate._count.id || 0,
          revenue: Number(wonAggregate._sum.value || 0),
          avgDeal: Number(wonAggregate._avg.value || 0) // Pastikan ini juga dibungkus Number
      };
    };

    // Eksekusi Query
    const [current, last] = await Promise.all([
        getPeriodStats(currentStart, currentEnd),
        getPeriodStats(lastStart, lastEnd)
    ]);

    return NextResponse.json({
        data: {
            pipelineValue: { value: current.pipelineValue, growth: calcGrowth(current.pipelineValue, last.pipelineValue) },
            activeDeals: { count: current.activeCount, growth: calcGrowth(current.activeCount, last.activeCount) },
            avgDealSize: { value: current.avgDeal, growth: calcGrowth(current.avgDeal, last.avgDeal) },
            totalWon: { count: current.totalWon, growth: calcGrowth(current.totalWon, last.totalWon) },
            totalLost: { count: current.totalLost, growth: calcGrowth(current.totalLost, last.totalLost) },
            totalLeads: { count: current.totalLeads, growth: calcGrowth(current.totalLeads, last.totalLeads) }
        }
    });

  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}