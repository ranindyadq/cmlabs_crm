import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// POST: Buat Call baru UNTUK Lead tertentu
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id; // Ini ID Lead
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const newCall = await prisma.call.create({
      data: {
        ...body,
        leadId: leadId,
        userId: user.id
      }
    });

    return NextResponse.json({ data: newCall }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}