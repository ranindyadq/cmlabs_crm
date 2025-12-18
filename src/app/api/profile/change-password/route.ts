import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import bcrypt from "bcrypt"; // Pastikan install: npm install bcrypt @types/bcrypt

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    // 1. Ambil hash password user dari DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser?.passwordHash) {
      return NextResponse.json({ message: "Akun ini menggunakan login Google/OAuth." }, { status: 400 });
    }

    // 2. Cek apakah password lama benar
    const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ message: "Password saat ini salah." }, { status: 400 });
    }

    // 3. Hash password baru
    const newHash = await bcrypt.hash(newPassword, 10);

    // 4. Simpan & Catat Audit Log
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.auditLog.create({
        data: {
          actionType: "CHANGE_PASSWORD",
          entityType: "User",
          entityId: user.id,
          actorId: user.id,
          detailsJson: { message: "User changed their own password" }
        }
      })
    ]);

    return NextResponse.json({ message: "Password berhasil diubah." });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengubah password." }, { status: 500 });
  }
}