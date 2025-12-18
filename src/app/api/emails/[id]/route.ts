import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// Helper RBAC Check
async function checkAccess(emailId: string, user: any) {
  const email = await prisma.email.findUnique({ where: { id: emailId }, select: { userId: true } });
  if (!email) return { error: "Not Found", status: 404 };
  if (user.role !== 'ADMIN' && email.userId !== user.id) return { error: "Forbidden", status: 403 };
  return { success: true };
}

// PATCH
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  const check = await checkAccess(params.id, user);
  if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

  const body = await req.json();
  const updated = await prisma.email.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ message: "Email updated", data: updated });
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  const check = await checkAccess(params.id, user);
  if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

  await prisma.email.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Email deleted" }); // 200 OK
}