import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email.service"; 

// Opsional: Set max duration agar tidak timeout (Vercel Pro max 300s, Hobby 10s)
export const maxDuration = 10; 
export const dynamic = 'force-dynamic'; // Pastikan tidak di-cache

export async function GET(req: Request) {
  // 1. Keamanan: Cek Header Authorization dari Vercel
  const authHeader = req.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Cari email dengan status 'SCHEDULED' dan waktunya sudah lewat (lte: less than equal)
    const dueEmails = await prisma.email.findMany({
      where: {
        status: 'SCHEDULED', 
        scheduledAt: { 
            lte: new Date() 
        } 
      }
    });

    if (dueEmails.length === 0) {
        return NextResponse.json({ message: "No scheduled emails to send." });
    }

    // 3. Loop proses pengiriman
    for (const email of dueEmails) {
        try {
            // Format Body ke HTML sederhana
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <div style="white-space: pre-wrap;">${email.body || ""}</div>
                    <br/>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <p style="font-size: 12px; color: #888;">Sent from cmlabs-crm</p>
                </div>
            `;

            // Kirim Email
            // Note: Schema Anda 'toAddress' wajib (String), jadi aman tidak perlu cek null
            await sendEmail(
                email.toAddress,                // 1. to
                email.subject || "No Subject",  // 2. subject
                htmlContent,                    // 3. html
                email.ccAddress || undefined,      
                email.bccAddress || undefined,     
                email.attachmentUrl || undefined
            );

            // 4. Update status jadi SENT dan hapus jadwalnya
            await prisma.email.update({
                where: { id: email.id },
                data: { 
                    status: 'SENT', 
                    scheduledAt: null 
                }
            });

        } catch (sendError) {
            console.error(`Failed to send email ID ${email.id}:`, sendError);
            // Opsional: Tandai FAILED
            await prisma.email.update({
                where: { id: email.id },
                data: { status: 'FAILED' }
            });
        }
    }

    return NextResponse.json({ 
        success: true, 
        processed: dueEmails.length 
    });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}