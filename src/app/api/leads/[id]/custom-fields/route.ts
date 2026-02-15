import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const leadId = params.id;
  const { fieldId, value } = await req.json();

  // Validasi RBAC Lead Owner
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true }});
  if (!lead) return NextResponse.json({ message: "Lead not found" }, { status: 404 });
  
  if (user.role !== 'ADMIN' && lead.ownerId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.customFieldValue.upsert({
    where: { leadId_fieldId: { leadId, fieldId } },
    update: { value },
    create: { leadId, fieldId, value }
  });

  return NextResponse.json({ message: "Field value saved", data: result });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const leadId = params.id;
  
  // Ambil fieldId dari Query Params URL (contoh: ?fieldId=xyz)
  const { searchParams } = new URL(req.url);
  const fieldId = searchParams.get("fieldId");

  if (!fieldId) {
    return NextResponse.json({ message: "Field ID required" }, { status: 400 });
  }

  try {
    // Validasi Owner (Sama seperti POST)
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true }});
    if (user.role !== 'ADMIN' && lead?.ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Hapus data dari database
    await prisma.customFieldValue.delete({
      where: {
        leadId_fieldId: {
          leadId: leadId,
          fieldId: fieldId
        }
      }
    });

    return NextResponse.json({ message: "Field removed successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete field or field not found" }, { status: 500 });
  }
}