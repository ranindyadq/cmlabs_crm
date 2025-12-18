import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
// Pastikan path ini sesuai dengan lokasi utility email Anda di Next.js
import { sendEmail } from "@/services/email.service"; 

// =================================================================================
// HELPER: Generate Invoice HTML (Email Template)
// =================================================================================
const generateInvoiceHTML = (invoice: any, organization: any, lead: any) => {
  // Format angka ke Rupiah
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount);
  };

  const itemsHTML = invoice.items.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">${item.itemName}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 10px; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      
      <div style="border-bottom: 2px solid #5A4FB5; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #5A4FB5; margin: 0;">INVOICE #${invoice.invoiceNumber}</h2>
        <p style="color: #666; margin: 5px 0 0 0;">Dari: <strong>${organization.companyName}</strong></p>
      </div>

      <p>Halo <strong>${lead.contact?.name || "Pelanggan"}</strong>,</p>
      <p>Terima kasih atas kepercayaan Anda. Berikut adalah rincian tagihan untuk layanan kami:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f9f9f9; text-align: left;">
            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Qty</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Harga</th>
            <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: right;">
        <p style="margin: 5px 0;">Subtotal: ${formatCurrency(Number(invoice.subtotal))}</p>
        <p style="margin: 5px 0;">Tax (${invoice.taxPercent}%): ${formatCurrency(Number(invoice.totalAmount) - Number(invoice.subtotal))}</p>
        <h3 style="color: #5A4FB5; margin-top: 10px;">Total Tagihan: ${formatCurrency(Number(invoice.totalAmount))}</h3>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
        <p>Jatuh tempo pada: ${new Date(invoice.dueDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        <p>${organization.addressLine1 || ""} ${organization.city || ""}</p>
        <p>Jika ada pertanyaan, silakan balas email ini.</p>
      </div>
    </div>
  `;
};

// =================================================================================
// MAIN HANDLER: SEND INVOICE
// =================================================================================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // 1. Cek User Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil Data Invoice & Profil Organisasi secara Paralel
    const [invoice, organization] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          lead: {
            include: {
              contact: true, // Butuh email kontak
            },
          },
        },
      }),
      prisma.organizationProfile.findFirst()
    ]);

    // 3. Validasi Data
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    // 🔒 RBAC Check: Hanya Admin atau Pemilik Lead yang boleh kirim invoice
    if (user.role !== 'ADMIN' && invoice.lead.ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden: You don't have permission to send this invoice" }, { status: 403 });
    }

    if (!invoice.lead.contact?.email) {
      return NextResponse.json({ message: "Contact email is missing for this lead." }, { status: 400 });
    }

    if (!organization) {
      return NextResponse.json({ message: "Organization profile is not set up yet." }, { status: 400 });
    }

    // 4. Generate HTML & Kirim Email
    const htmlContent = generateInvoiceHTML(invoice, organization, invoice.lead);
    const subject = `Invoice #${invoice.invoiceNumber} from ${organization.companyName}`;

    await sendEmail(
      invoice.lead.contact.email,
      subject,
      htmlContent
    );

    // 5. Update Status Invoice -> SENT
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
    });

    return NextResponse.json({ 
      message: "Invoice sent successfully", 
      data: updatedInvoice 
    });

  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}