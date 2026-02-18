import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import path from 'path'; // 👈 TAMBAH INI
import fs from 'fs';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Cek Login
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // 'csv' | 'pdf'
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const picIdParam = searchParams.get('picId');

    // Paksa Filter Role
    const where: any = { deletedAt: null };
    
    if (user.role === 'ADMIN') {
      // Admin boleh filter by PIC jika mau
      if (picIdParam) where.ownerId = picIdParam; 
    } else {
      // Sales HANYA boleh lihat datanya sendiri
      where.ownerId = user.id;
    }

    if (status) where.status = status;
    
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
        { label: 'Deal Title', value: 'title' },
        // Pastikan row.value di-cast ke number/string
        { label: 'Amount', value: (row: any) => row.value }, 
        
        // ✅ PERBAIKAN DI SINI:
        // Tambahkan properti 'value'. Kita isi 'currency' (meski di DB tidak ada).
        // Karena field 'currency' tidak ditemukan di data, maka 'default: IDR' akan otomatis dipakai.
        { label: 'Currency', value: 'currency', default: 'IDR' }, 
        
        { label: 'Status', value: 'status' },
        { label: 'Stage', value: 'stage' },
        { label: 'Owner Name', value: 'owner.fullName' },
        { label: 'Company', value: 'company.name', default: '-' },
        { label: 'Created Date', value: (row: any) => new Date(row.createdAt).toISOString().split('T')[0] }
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
    const chunks: any[] = [];
    // Margin atas lebih besar untuk Header
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    doc.on('data', (chunk: any) => chunks.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        let periodText = "All Time";
        if (startDate && endDate) {
            periodText = `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
        } else if (startDate) {
            periodText = `Since ${new Date(startDate).toLocaleDateString('id-ID')}`;
        }

        // Menentukan PIC secara dinamis
        let picText = user.email || 'Admin';
        if (user.role === 'ADMIN') {
            picText = picIdParam ? "Selected Sales Member" : "All Sales Team";
        }

        // --- 1. HEADER SECTION ---
        // Garis Aksen Ungu di paling atas
        doc.rect(0, 0, 595.28, 10).fill('#5A4FB5'); // Lebar A4 full

        try {
          const logoPath = path.join(process.cwd(), 'public', 'logo.png');
          if (fs.existsSync(logoPath)) {
            // Gambar logo jika file benar-benar ada di folder public/logo.png
            doc.image(logoPath, 40, 30, { width: 100 }); 
          }
        } catch (err) {
          console.log("Logo file not found, skipping rendering logo.");
        }

        // Judul Laporan
        doc.moveDown(2);
        doc.fillColor('#333333').font('Helvetica-Bold').fontSize(20)
           .text('Quarterly Evaluation Report', 40, 80, { align: 'left' });

        // Metadata Laporan (Kanan Atas)
        doc.fontSize(10).font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, 400, 50, { align: 'right' })
           .text(`Period: ${periodText}`, 400, 65, { align: 'right' })
           .text(`PIC: ${picText}`, 400, 80, { align: 'right' });

        // Garis Pembatas
        doc.moveTo(40, 110).lineTo(555, 110).lineWidth(0.5).strokeColor('#E0E0E0').stroke();

        // --- 2. SUMMARY CARDS (Kotak Ringkasan) ---
        const totalValue = leads.reduce((acc, curr) => acc + Number(curr.value), 0);
        const totalWon = leads.filter(l => l.status === 'WON').length;
        
        // Fungsi Helper Gambar Kartu
        const drawCard = (x: number, title: string, value: string, color: string) => {
            // Background Card
            doc.roundedRect(x, 130, 120, 60, 5).fillAndStroke('#F9FAFB', '#E5E7EB');
            // Title
            doc.fillColor('#666666').fontSize(8).font('Helvetica').text(title, x + 10, 140);
            // Value
            doc.fillColor(color).fontSize(14).font('Helvetica-Bold').text(value, x + 10, 160);
        };

        const formatNumber = (num: number) => {
            if (num >= 1000000000) return `IDR ${(num / 1000000000).toFixed(1)}B`;
            if (num >= 1000000) return `IDR ${(num / 1000000).toFixed(1)}M`;
            return `IDR ${num.toLocaleString('id-ID')}`;
        };

        drawCard(40, 'TOTAL REVENUE', formatNumber(totalValue), '#5A4FB5'); 
        drawCard(170, 'TOTAL LEADS', leads.length.toString(), '#333333');
        drawCard(300, 'DEALS WON', totalWon.toString(), '#257047'); 
        drawCard(430, 'AVG DEAL SIZE', formatNumber(leads.length > 0 ? totalValue/leads.length : 0), '#333333');

        // --- 3. TABEL DATA ---
        let y = 220;
        
        // Header Tabel
        doc.rect(40, y, 515, 25).fill('#5A4FB5'); // Header Ungu Solid
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        
        doc.text('DEAL TITLE', 50, y + 8);
        doc.text('OWNER', 220, y + 8);
        doc.text('STATUS', 320, y + 8, { width: 60, align: 'center' });
        doc.text('VALUE (IDR)', 400, y + 8, { width: 140, align: 'right' });

        y += 25;

        // Loop Data
        doc.font('Helvetica').fontSize(9);
        
        leads.forEach((lead, i) => {
            // Cek Halaman Baru
            if (y > 730) {
                doc.addPage();
                y = 40;
                doc.rect(40, y, 515, 25).fill('#5A4FB5'); 
                doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
                doc.text('DEAL TITLE', 50, y + 8);
                doc.text('OWNER', 220, y + 8);
                doc.text('STATUS', 320, y + 8, { width: 60, align: 'center' });
                doc.text('VALUE (IDR)', 400, y + 8, { width: 140, align: 'right' });
                y += 25;
                doc.font('Helvetica').fontSize(9);
            }

            // Zebra Striping (Baris Genap dikasih background abu)
            if (i % 2 === 0) {
                doc.rect(40, y, 515, 20).fill('#F3F4F6');
            }

            // Warna Status (Semantic Colors)
            let statusColor = '#333333';
            if (lead.status === 'WON') statusColor = '#257047'; // Hijau
            else if (lead.status === 'LOST') statusColor = '#C11106'; // Merah
            else statusColor = '#FFAB00'; // Kuning/Warning

            // Isi Data
            doc.fillColor('#333333').text(lead.title, 50, y + 6, { width: 160, height: 12, ellipsis: true });
            doc.text(lead.owner?.fullName || '-', 220, y + 6, { width: 90, height: 12, ellipsis: true });
            
            doc.fillColor(statusColor).font('Helvetica-Bold')
               .text(lead.status, 320, y + 6, { width: 60, align: 'center' });
            
            doc.font('Helvetica').fillColor('#333333')
               .text(Number(lead.value).toLocaleString('id-ID'), 400, y + 6, { width: 140, align: 'right' });

            y += 20; // Tinggi baris
        });

        // Footer Numbering
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            
            // Garis pembatas footer
            doc.moveTo(40, 780).lineTo(555, 780).lineWidth(0.5).strokeColor('#E0E0E0').stroke();
            
            // Teks Footer
            doc.fontSize(8).fillColor('#AAAAAA')
               .text(`Page ${i + 1} of ${pages.count} | Generated from cmlabs CRM`, 40, 790, { align: 'center' });
        }

        doc.end();
      });

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