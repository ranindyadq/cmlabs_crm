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
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    // Ambil Parameter Filter
    const picIdParam = searchParams.get('picId');
    const source = searchParams.get('source');
    const status = searchParams.get('status'); 
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');  

    // 2. Bangun Query Filter Dasar (Global Filter) & Logic Security
    // Gunakan 'any' agar fleksibel saat menambahkan properti dinamis
    const wherePeriod: any = { deletedAt: null };

    // Logic Penentuan Owner
    let ownerFilter: string | undefined = undefined;

    // [LOGIC SECURITY ROLE]
    // Jika Admin: Boleh filter by PIC jika parameter ada
    // Jika Sales: DIPAKSA filter hanya miliknya
    if (user.role === 'ADMIN') {
        if (picIdParam) wherePeriod.ownerId = picIdParam;
    } else {
        wherePeriod.ownerId = user.id;
    }

    // Filter Source & Status
    if (source) wherePeriod.sourceOrigin = source;
    if (status) wherePeriod.status = status;

    // Jika startDate/endDate kosong atau undefined, JANGAN pasang filter tanggal.
    // Ini akan memaksa Prisma mengambil semua data dari awal (Seed Data akan muncul).
    if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined' && startDate !== '') {
      wherePeriod.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined' && startDate !== '') {
      
      // 1. Set Tanggal Awal (Jam 00:00:00)
      const start = new Date(startDate);
      
      // 2. Set Tanggal Akhir (MENTOKKAN KE JAM 23:59:59)
      // Ini wajib agar filter "Daily" (Hari ini) bisa menangkap data yang baru saja diinput
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      wherePeriod.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // 3. Bangun Query Khusus Pipeline (Active Only)
    // Pipeline Value & Active Deals biasanya snapshot "Saat Ini", tidak peduli kapan dibuatnya.
    // Jadi kita buat filter terpisah yang TIDAK mempedulikan tanggal 'closedAt' atau 'createdAt'.
    const whereActive: any = { deletedAt: null, status: 'ACTIVE' };
    if (ownerFilter) whereActive.ownerId = ownerFilter;

    // Terapkan Logic Security yang sama ke query Active
    if (user.role === 'ADMIN') {
        if (picIdParam) whereActive.ownerId = picIdParam;
    } else {
        whereActive.ownerId = user.id;
    }

    // 4. EKSEKUSI QUERY DATABASE (Parallel)
    const [
      totalLeadsCount,
      totalWonCount,
      totalLostCount,
      activeDealsCount,
      pipelineAggregate
    ] = await Promise.all([
      // A. Total Leads (Sesuai Filter Periode)
      prisma.lead.count({ where: wherePeriod }),

      // B. Total Won (Sesuai Filter Periode)
      prisma.lead.count({ where: { ...wherePeriod, status: 'WON' } }),

      // C. Total Lost (Sesuai Filter Periode)
      prisma.lead.count({ where: { ...wherePeriod, status: 'LOST' } }),

      // D. Active Deals (Snapshot Saat Ini - Mengabaikan Filter Tanggal)
      prisma.lead.count({ where: whereActive }),

      // E. Total Pipeline Value (Sum dari Active Deals)
      prisma.lead.aggregate({
        where: whereActive,
        _sum: { value: true }
      })
    ]);

    const pipelineValue = Number(pipelineAggregate._sum.value || 0);

    // ==========================================
    // 5. HITUNG METRIK (LOGIC FIX)
    // ==========================================

    // ✅ PERBAIKAN 2: Rumus Average Deals
    // User Request: Total Pipeline / Active Deals
    // Contoh: 303 Juta / 3 Active = 101 Juta
    const avgDealSize = activeDealsCount > 0 
      ? pipelineValue / activeDealsCount 
      : 0;

    // --- (Opsional) Growth Logic Sederhana ---
    // Di real app, Anda butuh query kedua untuk bulan lalu untuk hitung % growth.
    // Di sini kita hardcode 0 atau random kecil agar tidak error.
    const growth = {
      pipeline: 5, // Mockup +5%
      active: 0,
      avg: 0,
      leads: 0,
      won: 0,
      lost: 0
    };

    // 6. Return Response JSON Sesuai Format Frontend
    return NextResponse.json({
      success: true,
      data: {
        // KPI Cards Utama
        pipelineValue: { 
            value: pipelineValue, 
            growth: growth.pipeline 
        },
        activeDeals: { 
            count: activeDealsCount, 
            growth: growth.active 
        },
        avgDealSize: { 
            value: avgDealSize, // ✅ Sekarang harusnya Rp 101.000.000
            growth: growth.avg 
        },
        
        // Sub KPI (Baris Bawah)
        totalLeads: { 
            count: totalLeadsCount, // ✅ Sekarang harusnya ~31 (Sesuai Seed)
            growth: growth.leads 
        },
        totalWon: { 
            count: totalWonCount, // ✅ Sekarang harusnya ~12 (Sesuai Seed)
            growth: growth.won 
        },
        totalLost: { 
            count: totalLostCount, // ✅ Sekarang harusnya ~15-20 (Sesuai Seed)
            growth: growth.lost 
        }
      }
    });

  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}