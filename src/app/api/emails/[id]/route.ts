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

// PATCH (Update Email)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    const check = await checkAccess(params.id, user);
    if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

    const body = await req.json();

    // Validasi sederhana: Jangan biarkan user mengubah 'sentAt' atau 'leadId' sembarangan
    // Ambil field yang boleh diubah saja
    const { subject, body: emailBody, toAddress, ccAddress, bccAddress, scheduledAt, attachmentUrl } = body;

    // Logika Status: Jika user mengubah jadwal, kembalikan status ke SCHEDULED
    let statusUpdate = {};
    if (scheduledAt) {
        statusUpdate = { status: 'SCHEDULED', scheduledAt: new Date(scheduledAt) };
    }

    const updated = await prisma.email.update({
        where: { id: params.id },
        data: {
            subject,
            body: emailBody,
            toAddress,
            ccAddress,
            bccAddress,
            attachmentUrl,
            ...statusUpdate
        }
    });

    return NextResponse.json({ message: "Email updated", data: updated });
  } catch (error) {
    return NextResponse.json({ message: "Error updating" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  const check = await checkAccess(params.id, user);
  if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

  await prisma.email.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Email deleted" }); // 200 OK
}