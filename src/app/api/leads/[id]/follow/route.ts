import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // 2. Ambil user asli dari session/token
    const user = await getSessionUser(req); 
    
    // 3. Validasi: Kalau belum login, tolak!
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leadId = params.id;
    const userId = user.id;

    // Logika Prisma (SAMA PERSIS DENGAN CONTROLLER LAMA)
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        followers: { 
          connect: { id: userId } 
        } 
      }
    });

    return NextResponse.json({ message: "Lead followed successfully" });

  } catch (error) {
    console.error("Error following lead:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}