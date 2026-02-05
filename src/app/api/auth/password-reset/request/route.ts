import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
// Import dari service email yang Anda kirim (path-nya disesuaikan)
import { sendResetPasswordEmail } from "@/services/email.service"; 

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper Audit
async function logAudit(actorId: string | null, targetId: string | null, actionType: string, details: any) {
  try {
    // FIX: Jika actorId adalah 'SYSTEM', ubah jadi null agar tidak kena Foreign Key Error
    // Database akan mencatat actorId sebagai NULL, yang berarti aksi sistem/anonim
    const finalActorId = actorId === 'SYSTEM' ? null : actorId;

    await prisma.auditLog.create({
      data: { 
        actorId: finalActorId, 
        targetId, 
        actionType, 
        detailsJson: details || {} 
      },
    });
  } catch (err) { 
    // Gunakan 'any' untuk err agar aman di TypeScript
    console.error(`Audit Log Failed:`, err); 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email } });

    // LOGIKA LAMA: Anti-Enumeration (Return 200 meski user ga ada)
    if (!user) {
      return NextResponse.json({ message: 'Jika email terdaftar, link reset telah dikirim.' }, { status: 200 });
    }

    // Hapus token lama
    await prisma.passwordReset.deleteMany({ where: { userId: user.id, used: false } });

    // Generate Token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Kirim Email
    const resetLink = `${FRONTEND_URL.replace(/\/$/, '')}/auth/set-new-password?token=${token}`;
    
    // Jangan await email agar response cepat
    sendResetPasswordEmail(user.email, resetLink)
      .then(() => logAudit('SYSTEM', user.id, 'PASSWORD_RESET_REQUEST', { tokenExpires: expiresAt }))
      .catch((err: any) => logAudit('SYSTEM', user.id, 'EMAIL_SEND_FAILED', { error: err.message }));

    return NextResponse.json({ message: 'Jika email terdaftar, link reset telah dikirim.' }, { status: 200 });

  } catch (error) {
    console.error('Error in password-reset/request:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}