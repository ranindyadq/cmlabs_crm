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
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { 
        taxPercent: true, 
        lead: { select: { ownerId: true } } 
      }
    });

    if (!currentInvoice) return NextResponse.json({ message: "Not Found" }, { status: 404 });
    if (user.role !== 'ADMIN' && currentInvoice.lead.ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const { items, leadId, id, tax, ...data } = body; 

    // 1. Sanitasi Tanggal
    if (data.invoiceDate) data.invoiceDate = new Date(data.invoiceDate);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    // 2. Sanitasi Enum (Draft -> DRAFT)
    if (data.status) data.status = data.status.toUpperCase();

    // 3. Logika perhitungan ulang (jika ada perubahan item)
    if (items?.length) {
      let subtotal = 0;
      items.forEach((i: any) => subtotal += Number(i.quantity) * Number(i.unitPrice));
      
      // Ambil taxPercent dari DB (atau default 10 jika null)
      const taxPercent = Number(currentInvoice.taxPercent || 10);
      const taxMultiplier = taxPercent / 100;
      
      data.subtotal = subtotal;
      data.totalAmount = subtotal + (subtotal * taxMultiplier);
      
      // PENTING: Jangan masukkan 'tax' ke object 'data' karena Prisma akan error lagi.
      // Database Anda hanya menyimpan taxPercent, subtotal, dan totalAmount.
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Sekarang 'data' sudah BERSIH dari 'tax' dan 'leadId'
      const inv = await tx.invoice.update({ 
        where: { id: params.id }, 
        data: data 
      });
      
      // ... (logic update items tetap sama) ...
      if (items?.length) {
          await tx.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
          await tx.invoiceItem.createMany({
            data: items.map((i: any) => ({
              invoiceId: params.id,
              itemName: i.itemName,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              total: Number(i.quantity) * Number(i.unitPrice)
            }))
          });
      }

      return inv;
    });

    return NextResponse.json({ message: "Invoice updated", data: updated });

  } catch (error: any) {
    console.error("Update Error Detail:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const check = await checkInvoiceAccess(params.id, user);
  if (check.error) return NextResponse.json({ message: check.error }, { status: check.status });

  try {
    await prisma.invoice.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete invoice" }, { status: 500 });
  }
}