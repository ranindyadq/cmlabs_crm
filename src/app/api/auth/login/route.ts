import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_crm_dua_puluh_lima';

async function logAudit(actorId: string | null, targetId: string | null, actionType: string, details: any) {
  try {
    await prisma.auditLog.create({
      data: { actorId, targetId, actionType, detailsJson: details || {} },
    });
  } catch (err) { console.error(`Audit Log Failed:`, err); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Cari User + Role (LOGIKA LAMA: Include role name)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: { select: { name: true } }
      }
    });

    // 2. Validasi Password
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: 'Email atau kata sandi salah.' }, { status: 401 });
    }

    // 3. Validasi Status ACTIVE (LOGIKA LAMA: Status Check)
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        message: `Akses ditolak. Status akun Anda: ${user.status.toLowerCase()}. Hubungi Admin untuk bantuan.`,
      }, { status: 403 });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

      const cookie = serialize('token', token, {
      httpOnly: true, // Aman dari XSS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 jam
    });

    // 5. Update Last Login & Audit
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await logAudit(user.id, user.id, 'USER_SIGNIN_SUCCESS', { method: 'email/password' });

    // 6. Return Response (Sesuai Frontend yg sudah connect)
    const response = NextResponse.json({
      message: 'Login berhasil.',
      role: user.role.name,
      token // Tetap kirim token untuk LocalStorage (apiClient)
    }, { status: 200 });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Error in signIn:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server saat login.' }, { status: 500 });
  }
}