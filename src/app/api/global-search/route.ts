import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  try {
    // 1. Cek Login & Ambil User 
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil Query Param
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
      return NextResponse.json({ message: "Search query 'q' cannot be empty." }, { status: 400 });
    }

    // Kondisi pencarian dasar (case-insensitive)
    const searchCondition = {
      contains: query,
      mode: 'insensitive' as const, // 'as const' agar TypeScript tidak rewel
    };

    // ==========================================================
    // 3. LOGIKA RBAC (SAMA PERSIS DENGAN CONTROLLER LAMA)
    // ==========================================================
    
    // Default filter: Cari di Judul, Nama Kontak, atau Nama Perusahaan
    const whereLeads: any = {
      OR: [
        { title: searchCondition },
        // Pastikan relasi contact & company ada di schema.prisma
        { contact: { name: searchCondition } },
        { company: { name: searchCondition } }
      ],
      deletedAt: null,
    };

    // LOGIC UTAMA: Batasi akses jika bukan ADMIN
    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin) {
      whereLeads.ownerId = user.id;
    }

    // ==========================================================
    // 4. RBAC UNTUK CONTACTS & COMPANIES
    // Non-admin hanya bisa lihat contacts/companies dari lead mereka
    // ==========================================================
    const whereContacts: any = {
      OR: [
        { name: searchCondition },
        { email: searchCondition },
        { phone: searchCondition },
      ],
    };

    const whereCompanies: any = {
      OR: [
        { name: searchCondition },
        { website: searchCondition },
      ],
    };

    // Jika bukan admin, batasi contacts & companies ke yang terkait dengan lead user
    if (!isAdmin) {
      whereContacts.leads = {
        some: {
          ownerId: user.id,
          deletedAt: null,
        },
      };
      whereCompanies.leads = {
        some: {
          ownerId: user.id,
          deletedAt: null,
        },
      };
    }

    // ==========================================================
    // 5. JALANKAN PENCARIAN PARALEL
    // ==========================================================
    const SEARCH_LIMIT = 15; // Limit hasil pencarian
    
    const [leads, contacts, companies] = await prisma.$transaction([
      // 1. Leads
      prisma.lead.findMany({
        where: whereLeads,
        select: {
          id: true,
          title: true,
          status: true,
          stage: true,
          value: true,
        },
        orderBy: { createdAt: 'desc' },
        take: SEARCH_LIMIT,
      }),
      
      // 2. Contacts (RBAC applied)
      prisma.contact.findMany({
        where: whereContacts,
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
        },
        orderBy: { name: 'asc' },
        take: SEARCH_LIMIT,
      }),

      // 3. Companies (RBAC applied)
      prisma.company.findMany({
        where: whereCompanies,
        select: {
          id: true,
          name: true,
          website: true,
        },
        orderBy: { name: 'asc' },
        take: SEARCH_LIMIT,
      }),
    ]);

    // 5. Kembalikan Response
    return NextResponse.json({
      data: {
        leads,
        contacts,
        companies,
      },
    });

  } catch (error) {
    console.error("Error during global search:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}