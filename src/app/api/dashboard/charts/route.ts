import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Helper untuk serialize BigInt
const serializeBigInt = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ));
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const picId = searchParams.get('picId');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // --- 1. BASE CONDITIONS (Non-Date) ---
    let baseConditions = Prisma.sql`1=1`;
    if (picId) baseConditions = Prisma.sql`${baseConditions} AND "owner_id" = ${picId}`;
    if (source) baseConditions = Prisma.sql`${baseConditions} AND "source_origin" = ${source}`;
    
    // --- 2. DYNAMIC DATE CONDITIONS ---
    let createdDateConditions = Prisma.sql`1=1`;
    let closedDateConditions = Prisma.sql`1=1`;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 
        
        // Filter untuk Estimasi/Lead Baru
        createdDateConditions = Prisma.sql`AND "created_at" >= ${start} AND "created_at" <= ${end}`;
        // Filter untuk Realisasi (WON)
        closedDateConditions = Prisma.sql`AND "closed_at" >= ${start} AND "closed_at" <= ${end}`;
    } else {
        // Default 12 bulan terakhir
        createdDateConditions = Prisma.sql`AND "created_at" >= NOW() - INTERVAL '12 months'`;
        closedDateConditions = Prisma.sql`AND "closed_at" >= NOW() - INTERVAL '12 months'`;
    }
    
    // ------------------------------------------------------------------
    // 1. Leads By Month
    // ------------------------------------------------------------------
    const leadsByMonth = await prisma.$queryRaw`
      SELECT TO_CHAR("created_at", 'Mon') as month, COUNT("lead_id")::int as count
      FROM "leads"
      WHERE "deleted_at" IS NULL 
        AND ${baseConditions} 
        ${createdDateConditions}  // <--- GANTI 'conditions' MENJADI INI
      GROUP BY TO_CHAR("created_at", 'Mon'), TO_CHAR("created_at", 'YYYY-MM')
      ORDER BY TO_CHAR("created_at", 'YYYY-MM') ASC
    `;

    // ------------------------------------------------------------------
    // 2. Revenue Estimation (Semua Lead)
    // ------------------------------------------------------------------
    const revenueTrend = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("created_at", 'Mon') AS month,
        TO_CHAR("created_at", 'YYYY-MM') AS sort_key,
        SUM("value")::float AS revenue
      FROM "leads"
      WHERE "deleted_at" IS NULL AND ${baseConditions} ${createdDateConditions}
      GROUP BY TO_CHAR("created_at", 'Mon'), TO_CHAR("created_at", 'YYYY-MM')
      ORDER BY TO_CHAR("created_at", 'YYYY-MM') ASC
    `;

    // ------------------------------------------------------------------
    // 🔥 3. Revenue Realisation (Hanya Lead yang WON)
    // ------------------------------------------------------------------
    const realisationTrend = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("closed_at", 'Mon') AS month,
        TO_CHAR("closed_at", 'YYYY-MM') AS sort_key,
        SUM("value")::float AS realisation
      FROM "leads"
      WHERE "deleted_at" IS NULL 
        AND "status" = 'WON'
        AND "closed_at" IS NOT NULL
        AND ${baseConditions} ${closedDateConditions}
      GROUP BY TO_CHAR("closed_at", 'Mon'), TO_CHAR("closed_at", 'YYYY-MM')
      ORDER BY TO_CHAR("closed_at", 'YYYY-MM') ASC
    `;

    // ------------------------------------------------------------------
    // 🔥 4. Gabungkan Revenue Estimation dan Realisation
    // ------------------------------------------------------------------
    const revenueMap = new Map();
    
    // Masukkan data estimation
    (revenueTrend as any[]).forEach((item: any) => {
      revenueMap.set(item.month, {
        month: item.month,
        estimation: item.revenue || 0,
        realisation: 0
      });
    });
    
    // Tambahkan data realisation
    (realisationTrend as any[]).forEach((item: any) => {
      if (revenueMap.has(item.month)) {
        revenueMap.get(item.month).realisation = item.realisation || 0;
      } else {
        revenueMap.set(item.month, {
          month: item.month,
          estimation: 0,
          realisation: item.realisation || 0
        });
      }
    });
    
    // Convert Map ke Array
    const combinedRevenueTrend = Array.from(revenueMap.values());

    // ------------------------------------------------------------------
    // 5. Pipeline Overview
    // ------------------------------------------------------------------
    const pipelineWhere: any = { 
        deletedAt: null, 
        status: { notIn: ['WON', 'LOST'] } 
    };
    if (picId) pipelineWhere.ownerId = picId;
    if (source) pipelineWhere.sourceOrigin = source;
    if (status && status !== 'WON' && status !== 'LOST') {
        pipelineWhere.status = status; 
    }
    if (startDate && endDate) {
        pipelineWhere.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const stageData = await prisma.lead.groupBy({
      by: ['stage'],
      _count: { _all: true },
      where: pipelineWhere
    });

    // ------------------------------------------------------------------
    // 6. Source Breakdown
    // ------------------------------------------------------------------
    const sourceBreakdownWhere: any = { deletedAt: null };
    if (picId) sourceBreakdownWhere.ownerId = picId;
    if (source) sourceBreakdownWhere.sourceOrigin = source;

    const sourceData = await prisma.lead.groupBy({
      by: ['sourceOrigin'],
      _count: { _all: true },
      where: sourceBreakdownWhere
    });

    // ------------------------------------------------------------------
    // Format Data Akhir
    // ------------------------------------------------------------------
    const responseData = {
        leadsByMonth: serializeBigInt(leadsByMonth),
        revenueTrend: serializeBigInt(combinedRevenueTrend), // 🔥 Data gabungan
        pipelineOverview: stageData.map(i => ({
          stage: i.stage || 'Unassigned',
          count: i._count._all
        })),
        sourceBreakdown: sourceData.map(i => ({
          name: i.sourceOrigin || 'Unknown',
          value: i._count._all
        }))
    };

    return NextResponse.json({
        data: responseData
    });

  } catch (error: any) {
    console.error("🔥 Dashboard Charts Error:", error);
    return NextResponse.json({ 
      message: "Internal Error", 
      detail: error.message 
    }, { status: 500 });
  }
}