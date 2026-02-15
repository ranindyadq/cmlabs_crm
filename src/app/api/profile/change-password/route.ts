import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import bcrypt from "bcrypt";
import { z } from "zod"; // 1. Import Zod

// ==========================================
// 2. DEFINISI SCHEMA VALIDASI PASSWORD
// ==========================================
// Schema ini harus sama atau lebih ketat dari validasi frontend
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string()
    .min(8, "Password baru minimal 8 karakter")
    .regex(/[a-zA-Z]/, "Password baru harus mengandung huruf")
    .regex(/[0-9]/, "Password baru harus mengandung angka")
    // Opsional: Bisa tambah .regex(/[@$!%*?&]/) jika butuh simbol
});

export async function POST(req: Request) {
  // 1. Cek Session (Wajib Login)
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // ==========================================
    // 3. VALIDASI INPUT DENGAN ZOD
    // ==========================================
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      // Ambil pesan error pertama dari Zod untuk dikirim ke frontend
      const errorMessage = validation.error.errors[0].message;
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    // Ambil data yang sudah bersih/valid
    const { currentPassword, newPassword } = validation.data;

    // 4. Ambil hash password user dari DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Cek apakah user login via Google (tidak punya password)
    if (!dbUser?.passwordHash) {
      return NextResponse.json(
        { message: "This account uses Google/OAuth login and cannot change password." }, 
        { status: 400 }
      );
    }

    // 5. Cek apakah password lama benar (bcrypt compare)
    const isMatch = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    
    if (!isMatch) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }

    // 6. Cek: Password baru tidak boleh sama dengan password lama (Optional Security)
    if (currentPassword === newPassword) {
       return NextResponse.json({ message: "New password cannot be the same as the old password." }, { status: 400 });
    }

    // 7. Hash password baru
    const newHash = await bcrypt.hash(newPassword, 10);

    // 8. Simpan ke DB & Catat Audit Log (Transaction)
    await prisma.$transaction([
      // Update Password User
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      // Catat Log
      prisma.auditLog.create({
        data: {
          actionType: "CHANGE_PASSWORD",
          entityType: "User",
          entityId: user.id,
          actorId: user.id,
          detailsJson: { message: "User changed their own password via Profile Settings" }
        }
      })
    ]);

    return NextResponse.json({ message: "Password successfully changed." });

  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Server error occurred." }, { status: 500 });
  }
}