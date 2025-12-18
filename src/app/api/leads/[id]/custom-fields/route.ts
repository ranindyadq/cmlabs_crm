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