import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { sendEmail } from "@/services/email.service"; 

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Cek User Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil Email berdasarkan Lead ID
    const emails = await prisma.email.findMany({
      where: { 
        leadId: params.id 
      },
      orderBy: { 
        sentAt: 'desc' // Urutkan dari yang paling baru
      },
      include: {
        user: { // Ambil nama pengirim biar bisa ditampilkan
            select: { fullName: true, email: true, photo: true }
        }
      }
    });

    return NextResponse.json({ 
      message: "Emails fetched successfully", 
      data: emails 
    });

  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const leadId = params.id;
    const body = await req.json();

    const { 
      subject, 
      body: emailBody, 
      toAddress, 
      ccAddress, 
      bccAddress, 
      fromAddress, // Ini dari frontend (currentUser.email)
      scheduledAt,
      attachmentUrl
    } = body;

    // Logika Status Awal
    const initialStatus = scheduledAt ? 'SCHEDULED' : 'SENT';

    // 1. Simpan ke Database
    const newEmail = await prisma.email.create({
      data: {
        toAddress, // Wajib di schema Anda
        fromAddress: fromAddress || user.email, // Wajib, pakai fallback user login
        subject: subject || null, // Optional
        body: emailBody || null, // Optional
        ccAddress: ccAddress || null,
        bccAddress: bccAddress || null,
        
        sentAt: new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: initialStatus, // Field baru kita
        attachmentUrl: attachmentUrl || null,

        leadId: leadId,
        userId: user.id,
      },
    });

    // 2. Jika TIDAK dijadwalkan, kirim langsung sekarang
    if (!scheduledAt) {
      try {
        const htmlContent = `<div style="white-space: pre-wrap;">${emailBody || ""}</div>`;
        
        await sendEmail(
          toAddress,                    // 1. to
          subject || "No Subject",      // 2. subject
          htmlContent,                  // 3. html
          ccAddress || null,            // 4. cc (gunakan variable ccAddress dari body)
          bccAddress || null,           // 5. bcc (gunakan variable bccAddress dari body)
          attachmentUrl
        );
        // Status sudah default 'SENT' saat create, jadi tidak perlu update lagi
      } catch (error) {
        console.error("Direct send failed:", error);
        // Update jadi FAILED jika gagal kirim langsung
        await prisma.email.update({
            where: { id: newEmail.id },
            data: { status: 'FAILED' }
        });
      }
    }

    return NextResponse.json({ 
        message: scheduledAt ? "Email scheduled" : "Email sent", 
        data: newEmail 
    }, { status: 201 });

  } catch (error) {
    console.error("Create Email Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}