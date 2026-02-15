import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Pakai ini, jangan new PrismaClient()
import { getSessionUser } from "@/lib/auth-helper";

async function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV/${year}/${month}/`;

  // Cari invoice terakhir yang punya prefix sama
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    // Ambil 3 digit terakhir dan tambah 1
    const lastSequence = lastInvoice.invoiceNumber.split('/').pop();
    nextNumber = parseInt(lastSequence || "0") + 1;
  }

  // Format: INV/2026/02/001
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leadId = params.id;
    
    // --- TAMBAHAN VALIDASI LEAD ---
    const existingLead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        deletedAt: null // Pastikan lead tidak dalam kondisi soft-deleted
      },
      select: { id: true, companyId: true, contactId: true }
    });

    if (!existingLead) {
      return NextResponse.json({ message: "Lead not found or has been deleted." }, { status: 404 });
    }
    // ------------------------------

    const body = await req.json();

    const finalInvoiceNumber = body.invoiceNumber || await generateInvoiceNumber();

    const itemsInput = body.items; 
    const notesInput = body.notes;
    const dueDateInput = body.dueDate || body.due_date;

    if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
      return NextResponse.json({ message: "Minimal satu item wajib diisi." }, { status: 400 });
    }

    let subtotal = 0;
    const itemsToCreate = itemsInput.map((item: any) => {
        const name = item.itemName || item.item_name;
        const qty = Number(item.quantity || item.qty || 0);
        const price = Number(item.unitPrice || item.unit_price || 0);
        const lineTotal = qty * price;

        if (!name || qty <= 0 || price <= 0) {
            throw new Error(`Invalid item data: ${name}`);
        }

        subtotal += lineTotal;
        return {
            itemName: name,
            quantity: qty,
            unitPrice: price,
            total: lineTotal
        };
    });

    const taxPercent = body.taxPercent !== undefined ? Number(body.taxPercent) : 10; // ✅ Dinamis dari input
    const totalAmount = subtotal + (subtotal * (taxPercent / 100));

    // MENGGUNAKAN TRANSACTION UNTUK ATOMICITY
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Invoice
      const inv = await tx.invoice.create({
        data: {
          leadId: leadId,
          invoiceNumber: finalInvoiceNumber,
          status: "DRAFT",
          invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
          dueDate: dueDateInput ? new Date(dueDateInput) : new Date(),
          subtotal: subtotal,
          taxPercent: taxPercent,
          totalAmount: totalAmount,
          notes: notesInput || "",
          items: { create: itemsToCreate }
        },
        include: { items: true }
      });

      // 2. Update Lead Value secara otomatis
      await tx.lead.update({
        where: { id: leadId },
        data: { value: totalAmount }
      });

      return inv;
    });

    return NextResponse.json({ 
      message: "Invoice successfully created and lead value updated", 
      data: result 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create Invoice Error:", error.message);

    // ✅ Tangkap Error Unik Prisma (P2002)
    if (error.code === 'P2002' && error.meta?.target?.includes('invoiceNumber')) {
        return NextResponse.json(
            { message: "This invoice number is already in use. Please refresh or use a different number." }, 
            { status: 409 } // 409 Conflict
        );
    }

    return NextResponse.json({ message: error.message || "Failed to create invoice" }, { status: 500 });
  }
}

// === GET: AMBIL LIST INVOICE UNTUK LEAD INI ===
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
      const user = await getSessionUser(req);
      if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

      const leadId = params.id;

      const invoices = await prisma.invoice.findMany({
        where: { leadId: leadId },
        include: {
            items: true // Sertakan item agar bisa didetailkan
        },
        orderBy: { invoiceDate: 'desc' }
      });

      const formattedInvoices = invoices.map(inv => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxPercent: Number(inv.taxPercent),
    totalAmount: Number(inv.totalAmount),
    items: inv.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
    }))
}));

      return NextResponse.json({ data: invoices });
  } catch (error) {
      console.error("Get Invoices Error:", error);
      return NextResponse.json({ message: "Failed to fetch invoice data" }, { status: 500 });
  }
}