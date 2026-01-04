import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper"; // Import Helper Auth
import { validateRequest } from "@/lib/validate-request"; // Import Helper Validasi
import { createLeadSchema } from "@/validations/lead.schema"; // Import Schema Zod

// --- HELPER FUNCTION: Build Where Condition ---
const buildLeadWhereCondition = (searchParams: URLSearchParams) => {
  const search = searchParams.get('search');
  const view = searchParams.get('view');
  const picId = searchParams.get('picId');
  const labelId = searchParams.get('labelId');
  const source = searchParams.get('source');
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');

  const whereCondition: any = {
    deletedAt: null,
  };

  if (view === 'active') whereCondition.status = 'ACTIVE';
  else if (view === 'archived') whereCondition.status = { in: ['WON', 'LOST'] };

  if (search) {
    whereCondition.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { contact: { name: { contains: search, mode: 'insensitive' } } },
      { company: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (picId) whereCondition.ownerId = picId;
  if (labelId) whereCondition.labels = { some: { labelId: labelId } };
  if (source) whereCondition.sourceOrigin = source;

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
    // 1. CEK AUTHENTICATION (Proteksi Route)
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const whereCondition = buildLeadWhereCondition(searchParams);
    const baseWhere: any = { 
            deletedAt: null,
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

    const [leads, totalLeads] = await prisma.$transaction([
      prisma.lead.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        include: {
          owner: { select: { fullName: true, email: true } },
          contact: true,
          company: true,
          labels: { include: { label: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where: whereCondition }),
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
    // 1. CEK AUTHENTICATION
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. CEK VALIDASI BODY (Menggunakan Zod Schema)
    const validation = await validateRequest(req, createLeadSchema);
    
    // Jika validasi gagal, kembalikan detail error (400)
    if (!validation.success) {
      return validation.response; 
    }

    // Data yang sudah bersih dan bertipe aman
    const body = validation.data; 

    // 3. LOGIKA SIMPAN KE DATABASE
    const newLead = await prisma.lead.create({
      data: {
        title: body.title,
        value: body.value || 0,
        currency: body.currency || "IDR",
        stage: body.stage || "Lead In",
        description: body.description,
        dueDate: body.dueDate, // Zod coerce sudah mengubahnya jadi Date object
        
        // Relasi Owner: Gunakan ID user yang sedang login (Session)
        // Kecuali jika admin menginput ownerId lain (sesuai schema)
        ownerId: body.ownerId || user.id,
        
        // Relasi Label (Many-to-Many)
        // Sesuai schema validation, kita menerima labelId (singular)
        labels: {
          create: body.labelId 
            ? [{ label: { connect: { id: body.labelId } } }] 
            : []
        },

        // Relasi Opsional lain (Contact, Company, dll)
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
    // Tangani Error Foreign Key Prisma
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ message: 'Label, Contact, Company, or Owner not found' }, { status: 404 });
    }
    console.error("Error in createLead:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}