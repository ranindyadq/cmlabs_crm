import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- GET ALL LABELS ---
export async function GET() {
  try {
    const labels = await prisma.label.findMany({
      select: {
        id: true,
        name: true,
        colorHex: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}