import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// --- GET KANBAN DATA (Dikumpulkan berdasarkan Stage) ---
export async function GET(req: Request) {
    try {
        // 1. Auth Check
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Ambil filter dari query params (misal: picId, source, dll.)
        const { searchParams } = new URL(req.url);
        const picId = searchParams.get('picId');
        const source = searchParams.get('source');

        // Buat kondisi WHERE yang sama dengan di file leads/route.ts,
        // tetapi fokus pada Leads AKTIF (bukan WON/LOST)
        const baseWhere: any = { 
            deletedAt: null,
            status: { notIn: ['WON', 'LOST'] } // Hanya Leads Aktif
        };

        // Asumsi: getSessionUser mengembalikan role name (misal: "SALES", "ADMIN")
        // Jika user adalah SALES, PAKSA filter hanya milik dia sendiri
        if (user.role === 'SALES') {
            baseWhere.ownerId = user.id; 
        } else {
            // Jika Admin/Owner, baru boleh pakai filter dari URL
            const picId = searchParams.get('picId');
            if (picId) baseWhere.ownerId = picId;
        }
        
        if (picId) baseWhere.ownerId = picId;
        if (source) baseWhere.sourceOrigin = source;

        // 2. Ambil SEMUA Leads Aktif (Tanpa Pagination)
        const allLeads = await prisma.lead.findMany({
            where: baseWhere,
            include: {
                owner: { select: { fullName: true, email: true } },
                contact: { select: { name: true } }, // Hanya perlu nama kontak
                company: { select: { name: true } }, // Hanya perlu nama perusahaan
                labels: { include: { label: true } }
            },
            orderBy: { createdAt: 'asc' }, 
        });

        // 3. LOGIKA PENGELOMPOKAN DATA BERDASARKAN STAGE
        const groupedLeads: Record<string, any[]> = {};
        const totalValues: Record<string, number> = {};

        allLeads.forEach(lead => {
            const stage = lead.stage || 'Unassigned'; // Gunakan nama stage sebagai kunci
            
            // Inisialisasi array dan nilai jika stage belum ada
            if (!groupedLeads[stage]) {
                groupedLeads[stage] = [];
                totalValues[stage] = 0;
            }
            
            // Masukkan Lead ke kelompoknya
            groupedLeads[stage].push(lead);
            
            // Tambahkan nilai Leads
            totalValues[stage] += Number(lead.value || 0); 
        });


        // 4. Kirim Respon
        return NextResponse.json({
            data: groupedLeads,
            totalValues: totalValues
        });

    } catch (error) {
        console.error("Error fetching kanban leads:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}