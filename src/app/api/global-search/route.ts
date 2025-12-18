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
      return NextResponse.json({ message: "Search query 'q' tidak boleh kosong." }, { status: 400 });
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
    if (user.role !== 'ADMIN') {
      whereLeads.ownerId = user.id;
    }

    // ==========================================================
    // 4. JALANKAN PENCARIAN PARALEL (SAMA DENGAN LAMA)
    // ==========================================================
    const [leads, contacts, companies] = await prisma.$transaction([
      // 1. Leads
      prisma.lead.findMany({
        where: whereLeads,
        select: {
          id: true,
          title: true,
          status: true,
          stage: true
        },
        take: 5,
      }),
      
      // 2. Contacts
      prisma.contact.findMany({
        where: {
          OR: [
            { name: searchCondition },
            { email: searchCondition },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        take: 5,
      }),

      // 3. Companies
      prisma.company.findMany({
        where: {
          name: searchCondition,
        },
        select: {
          id: true,
          name: true,
        },
        take: 5,
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