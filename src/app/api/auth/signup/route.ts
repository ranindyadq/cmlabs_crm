import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, password } = body;
    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
    }
    // 1. Cek duplikasi email (LOGIKA LAMA: 409 Conflict)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    // 2. Cari Role VIEWER (LOGIKA LAMA: Wajib ada)
    const viewerRole = await prisma.role.findUnique({ where: { name: 'VIEWER' } });
    if (!viewerRole) {
      console.error('Kritikal: Role "VIEWER" tidak ditemukan.');
      return NextResponse.json({ message: 'Kesalahan konfigurasi server.' }, { status: 500 });
    }

    // 3. Hash Password & Buat User
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roleId: viewerRole.id,
        status: 'ACTIVE',
        isOauthUser: false,
      },
    });

    // 4. Audit Log
    await logAudit(newUser.id, newUser.id, 'USER_SIGNUP', { method: 'email/password' });

    return NextResponse.json({
      message: 'Pendaftaran berhasil. Silakan masuk ke akun Anda.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in signUp:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server saat pendaftaran.' }, { status: 500 });
  }
}