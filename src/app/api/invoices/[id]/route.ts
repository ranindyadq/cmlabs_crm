import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// Helper RBAC
async function checkInvoiceAccess(invoiceId: string, user: any) {
  const invoice = await prisma.invoice.findUnique({ 
    where: { id: invoiceId }, 
    select: { lead: { select: { ownerId: true } } } 
  });
  if (!invoice) return { error: "Not Found", status: 404 };
  if (user.role !== 'ADMIN' && invoice.lead.ownerId !== user.id) return { error: "Forbidden", status: 403 };
  return { success: true };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  // 1. Ambil data Invoice lama untuk cek akses DAN mendapatkan taxPercent
  const currentInvoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    select: { 
      taxPercent: true, // Ambil persentase pajak yang tersimpan
      lead: { select: { ownerId: true } } 
    }
  });

  if (!currentInvoice) return NextResponse.json({ message: "Not Found" }, { status: 404 });
  
  // RBAC Check
  if (user.role !== 'ADMIN' && currentInvoice.lead.ownerId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { items, ...data } = await req.json();

  // 2. Hitung ulang total jika items berubah menggunakan taxPercent dari DB
  if (items?.length) {
    let subtotal = 0;
    items.forEach((i: any) => subtotal += i.quantity * i.unitPrice);
    
    // Konversi taxPercent (misal 11) menjadi pengali (0.11)
    const taxMultiplier = Number(currentInvoice.taxPercent || 0) / 100;
    
    data.subtotal = subtotal;
    data.totalAmount = subtotal + (subtotal * taxMultiplier);
  }

  // 3. Transaksi Update (Tetap sama)
  const updated = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.update({ where: { id: params.id }, data });
    
    if (items?.length) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
      await tx.invoiceItem.createMany({
        data: items.map((i: any) => ({
          invoiceId: params.id,
          itemName: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice
        }))
      });
    }
    return inv;
  });

  return NextResponse.json({ message: "Invoice updated", data: updated });
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  const check = await checkInvoiceAccess(params.id, user);
  if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Invoice deleted" });
}