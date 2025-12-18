import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// GET: Ambil semua definisi field
export async function GET() {
  const fields = await prisma.customField.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ data: fields });
}

// POST: Buat field baru (Admin Only)
export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { name, type } = await req.json();
  const newField = await prisma.customField.create({
    data: { name, type }
  });

  return NextResponse.json({ message: "Field created", data: newField }, { status: 201 });
}