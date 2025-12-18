import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// Force Node.js Runtime agar PDFKit & FS berfungsi (PENTING)
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // 'csv' | 'pdf'
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const picId = searchParams.get('picId');

    // 1. Build Query
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (picId) where.ownerId = picId;
    
    if (startDate && endDate) {
      const dateField = (status === 'WON' || status === 'LOST') ? 'closedAt' : 'createdAt';
      where[dateField] = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    // 2. Fetch Data
    const leads = await prisma.lead.findMany({
      where,
      include: { 
        owner: { select: { fullName: true } },
        contact: { select: { name: true } },
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const filename = `CRM_Report_${Date.now()}`;

    // =========================================================
    // EXPORT CSV
    // =========================================================
    if (format === 'csv') {
      const fields = [
        { label: 'Title', value: 'title' },
        { label: 'Value', value: 'value' },
        { label: 'Status', value: 'status' },
        { label: 'Stage', value: 'stage' },
        { label: 'Owner', value: 'owner.fullName' },
        { label: 'Contact', value: 'contact.name' },
        { label: 'Created At', value: (row: any) => new Date(row.createdAt).toLocaleDateString('id-ID') }
      ];
      
      const parser = new Parser({ fields });
      const csv = parser.parse(leads);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // =========================================================
    // EXPORT PDF
    // =========================================================
    if (format === 'pdf') {
      // Kita gunakan Buffer untuk menampung PDF di memori sebelum dikirim
      const chunks: any[] = []; // ✅ FIX: Tambahkan tipe 'any[]' atau 'Buffer[]'
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      // ✅ FIX: Tambahkan tipe '(chunk: any)' untuk menghindari error implicit any
      doc.on('data', (chunk: any) => chunks.push(chunk));
      
      // Promise agar PDF selesai digenerate sebelum response dikirim
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // --- PDF CONTENT GENERATION ---
        
        // 1. Header
        doc.fontSize(18).text('CRM Executive Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
        doc.moveDown();

        // 2. Summary Simple
        const totalValue = leads.reduce((acc, curr) => acc + Number(curr.value), 0);
        doc.fontSize(12).text(`Total Leads: ${leads.length}`);
        doc.text(`Total Value: IDR ${totalValue.toLocaleString('id-ID')}`);
        doc.moveDown();

        // 3. Table Headers
        const tableTop = 200;
        let y = tableTop;
        
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Title', 50, y);
        doc.text('Status', 250, y);
        doc.text('Owner', 350, y);
        doc.text('Value (IDR)', 450, y, { align: 'right' });
        
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;

        // 4. Data Rows
        doc.font('Helvetica').fontSize(9);
        
        leads.forEach((lead) => {
          // Add Page if needed
          if (y > 750) {
            doc.addPage();
            y = 50;
          }

          doc.text(lead.title.substring(0, 30), 50, y);
          doc.text(lead.status, 250, y);
          doc.text(lead.owner?.fullName || '-', 350, y);
          doc.text(Number(lead.value).toLocaleString('id-ID'), 450, y, { align: 'right' });
          
          y += 20;
        });

        doc.end();
      });

      // ✅ FIX: Casting 'pdfBuffer as any' karena definisi tipe NextResponse agak strict
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    return NextResponse.json({ message: "Invalid format specified" }, { status: 400 });

  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ message: "Failed to export report" }, { status: 500 });
  }
}