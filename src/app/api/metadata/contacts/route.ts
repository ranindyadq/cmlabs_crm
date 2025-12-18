import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET ALL CONTACTS ---
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}