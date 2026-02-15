import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV/${year}/${month}/`;

  // Cari invoice terakhir
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('/');
    const lastSequence = parts[parts.length - 1]; // Ambil bagian terakhir
    const parsed = parseInt(lastSequence);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  const newNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
  
  return NextResponse.json({ nextNumber: newNumber });
}