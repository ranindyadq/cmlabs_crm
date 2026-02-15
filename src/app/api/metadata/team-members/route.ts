import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET TEAM MEMBERS (DROPDOWN) ---
export async function GET() {
  try {
    // Logika asli: Ambil user yang aktif saja
    const members = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        photo: true // Tambahan opsional, aman dihapus jika tidak perlu
      },
      orderBy: { fullName: 'asc' }
    });
    
    return NextResponse.json({ data: members });
  } catch (error) {
    console.error("Error fetching team members for dropdown:", error);
    return NextResponse.json({ message: "Failed to fetch team member data." }, { status: 500 });
  }
}