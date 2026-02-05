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

        const { searchParams } = new URL(req.url);

        // 1. Ambil Parameter Filter
        const search = searchParams.get('search'); // Pencarian Nama Lead/Company
        const picId = searchParams.get('picId');
        const source = searchParams.get('source');
        const labelId = searchParams.get('labelId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        // Buat kondisi WHERE yang sama dengan di file leads/route.ts,
        // tetapi fokus pada Leads AKTIF (bukan WON/LOST)
        const baseWhere: any = { 
            deletedAt: null,
        };

        // --- FILTER LOGIC ---
        
        // A. Search (Title / Company Name)
        if (search) {
            baseWhere.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { company: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // B. PIC / Owner
        // Security: Jika Sales, PAKSA filter ke diri sendiri
        if (user.role === 'SALES') {
            baseWhere.ownerId = user.id; 
        } else {
            // Jika Admin, baru boleh filter PIC lain
            if (picId) baseWhere.ownerId = picId;
        }

        // C. Source
        if (source) baseWhere.sourceOrigin = source;

        // D. Label
        if (labelId) {
            baseWhere.labels = {
                some: { labelId: labelId }
            };
        }

        // E. Date Range (Created At)
        if (startDate && endDate) {
            baseWhere.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // 🟢 F. Status (Stage)
        if (status) {
            baseWhere.stage = status;
        }

        // 2. Ambil SEMUA Leads Aktif (Tanpa Pagination)
        const allLeads = await prisma.lead.findMany({
            where: baseWhere,
            include: {
                owner: { select: { fullName: true, email: true, photo: true } },
                contact: { select: { name: true } }, 
                company: { select: { name: true } }, 
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