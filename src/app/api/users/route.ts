import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { Status } from "@prisma/client"; // Import Enum Status dari Prisma

export async function GET(req: Request) {
  // 1. Cek Auth (Hanya user login yang bisa lihat daftar user lain)
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Ambil Query Params (contoh: ?status=ACTIVE)
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    // 3. Bangun Filter Prisma
    const whereClause: any = {};

    // Jika ada parameter status, kita filter. 
    // Kita pastikan statusnya valid sesuai Enum Prisma (ACTIVE, INACTIVE, dll)
    if (statusParam && Object.values(Status).includes(statusParam as Status)) {
      whereClause.status = statusParam as Status;
    }

    // 4. Fetch Data dari Database
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        role: {
          select: { name: true }
        }
      },
      orderBy: {
        fullName: 'asc' // Urutkan nama A-Z agar dropdown rapi
      }
    });

    return NextResponse.json({ data: users });

  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}