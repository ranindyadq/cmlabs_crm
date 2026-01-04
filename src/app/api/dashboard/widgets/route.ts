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

    // [FIX SECURITY]
    const where: any = { deletedAt: null };

    // 1. TENTUKAN TARGET USER (FILTER ROLE)
    let targetUserId: string | undefined = undefined;
    
    if (user.role === 'ADMIN') {
        // Admin bisa pilih lihat siapa, atau undefined (lihat semua)
        if (picIdParam) targetUserId = picIdParam;
    } else {
        // Sales dipaksa lihat diri sendiri
        targetUserId = user.id;
    }

    // 2. BUILD QUERY FILTER (SESUAI SCHEMA ANDA)
        
    // A. Filter LEAD (Pakai ownerId & soft delete)
    const whereLead: any = { deletedAt: null };
    if (targetUserId) whereLead.ownerId = targetUserId;

    // B. Filter MEETING (Pakai organizerId)
    const whereMeeting: any = { startTime: { gte: new Date() } }; // Yang akan datang
    if (targetUserId) whereMeeting.organizerId = targetUserId;

    // C. Filter CALL (Pakai userId & status Scheduled)
    const whereCall: any = { 
        callTime: { gte: new Date() }, 
        status: 'SCHEDULED' 
    };
    if (targetUserId) whereCall.userId = targetUserId;

    // D. Filter EMAIL (Pakai userId & scheduledAt)
    const whereEmail: any = { 
        scheduledAt: { gte: new Date() } 
    };
    if (targetUserId) whereEmail.userId = targetUserId;

    // E. Filter INVOICE (Lewat Lead -> ownerId)
    // Ambil yang jatuh tempo di masa depan & belum lunas
    const whereInvoice: any = { 
        dueDate: { gte: new Date() },
        status: { in: ['DRAFT', 'SENT', 'OVERDUE'] } 
    };
    if (targetUserId) {
        whereInvoice.lead = { ownerId: targetUserId };
    }

    // 1. RECENT DEALS (5 Terakhir yang diupdate)
    const recentDeals = await prisma.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        value: true,
        status: true,
        updatedAt: true
      }
    });

    // 2. PIPELINE OVERVIEW (Group by Stage)
    // Ambil semua ACTIVE leads untuk dihitung stage-nya
    const activeLeads = await prisma.lead.findMany({
      where: { ...where, status: 'ACTIVE' },
      select: { stage: true }
    });

    const totalActive = activeLeads.length;
    const stageMap: Record<string, number> = {};
    
    activeLeads.forEach(l => {
        const stage = l.stage || "Unassigned";
        stageMap[stage] = (stageMap[stage] || 0) + 1;
    });

    // Ubah ke format array & hitung persen
    const pipelineOverview = Object.keys(stageMap).map(stage => ({
        stage,
        count: stageMap[stage],
        percentage: totalActive > 0 ? Math.round((stageMap[stage] / totalActive) * 100) : 0
    })).sort((a, b) => b.count - a.count); // Urutkan dari yang terbanyak


    // 3. QUARTER SUMMARY (Kuartal Ini)
    const now = new Date();
    const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
    const startOfQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);
    
    // Label Dinamis (Contoh: "Q1 2026")
    const quarterLabel = `Q${currentQuarter} ${now.getFullYear()}`;

    const whereQuarter = { 
        ...whereLead, 
        createdAt: { gte: startOfQuarter, lte: endOfQuarter } 
    };

    // A. Total Won Value (Quarter)
    const wonAggregate = await prisma.lead.aggregate({ where: { ...whereQuarter, status: 'WON' }, _sum: { value: true }, _count: { id: true }, _avg: { value: true } });
    // B. Total Pipeline Value (Quarter - Active)
    const pipelineAggregate = await prisma.lead.aggregate({ where: { ...whereQuarter, status: 'ACTIVE' }, _sum: { value: true } });

    const quarterSummary = {
        label: quarterLabel, // <--- TAMBAHKAN INI
        totalWon: Number(wonAggregate._sum.value || 0),
        avgDealSize: Number(wonAggregate._avg.value || 0),
        pipelineValue: Number(pipelineAggregate._sum.value || 0),
        wonCount: wonAggregate._count.id
    };

    // 4. UPCOMING ACTIVITIES (Gabungan Meeting, Call, Email)
    const [meetingsRes, callsRes, emailsRes, invoicesRes] = await Promise.allSettled([
        prisma.meeting.findMany({
            where: whereMeeting,
            take: 5, orderBy: { startTime: 'asc' },
            include: { lead: { select: { contact: { select: { name: true } } } }, organizer: { select: { fullName: true } } }
        }),
        prisma.call.findMany({
            where: whereCall,
            take: 5, orderBy: { callTime: 'asc' },
            include: { lead: { select: { contact: { select: { name: true } } } }, user: { select: { fullName: true } } }
        }),
        prisma.email.findMany({
            where: whereEmail,
            take: 5, orderBy: { scheduledAt: 'asc' },
            include: { lead: { select: { contact: { select: { name: true } } } }, user: { select: { fullName: true } } }
        }),
        prisma.invoice.findMany({
            where: whereInvoice,
            take: 5, orderBy: { dueDate: 'asc' },
            include: { lead: { select: { title: true, contact: { select: { name: true } } } } }
        })
    ]);

    // Helper untuk ambil data dari Promise.allSettled
    const getData = (res: any) => res.status === 'fulfilled' ? res.value : [];

    return NextResponse.json({
      success: true,
      data: {
        recentDeals,
        pipelineOverview,
        quarterSummary,
        upcomingActivities: {
            meetings: getData(meetingsRes),
            calls: getData(callsRes),
            emails: getData(emailsRes),
            invoices: getData(invoicesRes)
        }
      }
    });

  } catch (error) {
    console.error("Widget API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}