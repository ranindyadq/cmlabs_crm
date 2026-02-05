import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { validateRequest } from "@/lib/validate-request";
import { createLeadSchema } from "@/validations/lead.schema";

// --- HELPER: Build Filter (Tanpa Logic Role Dulu) ---
const buildLeadWhereCondition = (searchParams: URLSearchParams) => {
  const search = searchParams.get('search');
  const view = searchParams.get('view');
  // picId kita handle terpisah di dalam logic Role agar aman
  const labelId = searchParams.get('labelId');
  const source = searchParams.get('source');
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');

  const whereCondition: any = {
    deletedAt: null,
  };

  // Filter View (Active vs Archived)
  // Asumsi: Status ACTIVE adalah yang sedang berjalan
  if (view === 'active') whereCondition.status = 'ACTIVE';
  else if (view === 'archived') whereCondition.status = { in: ['WON', 'LOST'] };

  // Search Logic (Global Search)
  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { contact: { name: { contains: search, mode: 'insensitive' } } },
      { company: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Filter Lainnya
  if (labelId) whereCondition.labels = { some: { labelId: labelId } };
  if (source) whereCondition.sourceOrigin = source;

  // Filter Tanggal
  if (dateStart && dateEnd) {
    whereCondition.createdAt = { gte: new Date(dateStart), lte: new Date(dateEnd) };
  } else if (dateStart) {
    whereCondition.createdAt = { gte: new Date(dateStart) };
  } else if (dateEnd) {
    whereCondition.createdAt = { lte: new Date(dateEnd) };
  }

  return whereCondition;
};

// --- GET ALL LEADS ---
export async function GET(req: Request) {
  try {
    // 1. CEK AUTH
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // 2. BUILD FILTER DASAR (Search, Date, dll)
    const filterWhere = buildLeadWhereCondition(searchParams);

    // 3. TERAPKAN LOGIKA ROLE (KEAMANAN DATA)
    // Kita gabungkan filter user + filter role
    const finalWhere = { ...filterWhere };

    if (user.role === 'SALES') {
       // 🔒 SALES: DIPAKSA hanya lihat punya sendiri
       finalWhere.ownerId = user.id;
    } else {
       // 🔓 ADMIN: Boleh lihat semua, atau filter by PIC jika diminta di URL
       const picIdParam = searchParams.get('picId');
       if (picIdParam) finalWhere.ownerId = picIdParam;
    }

    // 4. QUERY DATABASE
    const [leads, totalLeads] = await prisma.$transaction([
      prisma.lead.findMany({
        where: finalWhere, // <--- Pakai finalWhere yang sudah aman
        skip: skip,
        take: limit,
        include: {
          owner: { select: { fullName: true, email: true, photo: true } }, // Tambah photo biar UI bagus
          contact: true,
          company: true,
          labels: { include: { label: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where: finalWhere }),
    ]);

    const totalPages = Math.ceil(totalLeads / limit);

    return NextResponse.json({
      data: leads,
      pagination: {
        totalLeads,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error in getAllLeads:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// --- CREATE LEAD ---
export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const validation = await validateRequest(req, createLeadSchema);
    if (!validation.success) return validation.response; 

    const body = validation.data; 

    // 🔒 LOGIKA OWNER SAAT CREATE
    // Sales tidak boleh assign lead ke orang lain
    let assignedOwnerId = user.id;
    
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        // Admin boleh tentukan owner, kalau kosong default ke diri sendiri
        assignedOwnerId = body.ownerId || user.id;
    }

    const newLead = await prisma.lead.create({
      data: {
        title: body.title,
        value: body.value || 0,
        currency: body.currency || "IDR",
        stage: body.stage || "Lead In",
        description: body.description,
        dueDate: body.dueDate,
        
        ownerId: assignedOwnerId, // <--- Pakai ID yang sudah divalidasi
        
        labels: {
          create: body.labelId 
            ? [{ label: { connect: { id: body.labelId } } }] 
            : []
        },

        contactId: body.contactId,
        companyId: body.companyId,
        sourceOrigin: body.sourceOrigin,
        sourceChannel: body.sourceChannel,
        sourceChannelId: body.sourceChannelId,
      },
      include: {
        labels: { include: { label: true } },
        owner: true
      }
    });

    return NextResponse.json({
      message: 'Lead created successfully',
      data: newLead,
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ message: 'Data relation not found' }, { status: 404 });
    }
    console.error("Error in createLead:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}