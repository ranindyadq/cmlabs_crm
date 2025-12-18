import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const labels = await prisma.label.findMany({
    select: { id: true, name: true, colorHex: true },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ data: labels });
}