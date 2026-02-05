import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Pakai ini, jangan new PrismaClient()
import { getSessionUser } from "@/lib/auth-helper";

// === POST: MEMBUAT INVOICE BARU (SUPPORT MULTI-ITEMS) ===
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leadId = params.id;
    const body = await req.json();

    console.log("PAYLOAD RECEIVED:", body); // Debugging

    // 2. AMBIL DATA DARI BODY
    // Frontend mengirim array 'items', kita ambil itu.
    const itemsInput = body.items; 
    const notesInput = body.notes;
    const dueDateInput = body.dueDate || body.due_date;

    // 3. VALIDASI INPUT UTAMA
    if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
      console.log("❌ Gagal Validasi: Array items kosong");
      return NextResponse.json({ message: "Minimal satu item wajib diisi." }, { status: 400 });
    }

    // 4. LOOPING ITEMS & KALKULASI TOTAL
    let subtotal = 0;
    
    // Kita map array dari frontend menjadi format yang siap disimpan ke DB
    const itemsToCreate = itemsInput.map((item: any) => {
        const name = item.itemName || item.item_name;
        const qty = Number(item.quantity || item.qty || 0);
        const price = Number(item.unitPrice || item.unit_price || 0);
        const lineTotal = qty * price;

        // Validasi per item
        if (!name || qty <= 0 || price <= 0) {
            throw new Error(`Data item tidak valid: ${JSON.stringify(item)}`);
        }

        subtotal += lineTotal;

        return {
            itemName: name,
            quantity: qty,
            unitPrice: price,
            total: lineTotal
        };
    });

    // Hitung Pajak & Grand Total
    const taxPercent = 10; 
    const taxAmount = subtotal * (taxPercent / 100);
    const totalAmount = subtotal + taxAmount;

    // 5. SIMPAN KE DATABASE
    const newInvoice = await prisma.invoice.create({
      data: {
        leadId: leadId,
        // Gunakan nomor invoice dari frontend kalau ada, kalau tidak generate sendiri
        invoiceNumber: body.invoiceNumber || `INV-${Date.now()}`,
        status: "DRAFT",
        
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
        dueDate: dueDateInput ? new Date(dueDateInput) : new Date(),

        subtotal: subtotal,
        taxPercent: taxPercent,
        totalAmount: totalAmount,
        notes: notesInput || "",
        
        // Nested Create untuk Items
        items: {
          create: itemsToCreate 
        }
      },
      include: {
        items: true 
      }
    });

    return NextResponse.json({ 
      message: "Invoice berhasil dibuat", 
      data: newInvoice 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create Invoice Error:", error.message);
    // Tangkap error validasi item spesifik tadi
    if (error.message.includes("Data item tidak valid")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Gagal membuat invoice" }, { status: 500 });
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

      return NextResponse.json({ data: invoices });
  } catch (error) {
      console.error("Get Invoices Error:", error);
      return NextResponse.json({ message: "Gagal mengambil data invoice" }, { status: 500 });
  }
}