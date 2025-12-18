import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    const { token, newPassword } = body;

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });
    const now = new Date();

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt.getTime() <= now.getTime()) {
      return NextResponse.json({ message: 'Link reset tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Transaksi update
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true }
      }),
    ]);

    await logAudit('SYSTEM', resetRecord.userId, 'PASSWORD_RESET_SUCCESS', { tokenUsed: token });

    return NextResponse.json({ message: 'Kata sandi berhasil diatur ulang.' }, { status: 200 });

  } catch (error) {
    console.error('Error in password-reset/confirm:', error);
    return NextResponse.json({ message: 'Gagal mengatur kata sandi baru.' }, { status: 500 });
  }
}