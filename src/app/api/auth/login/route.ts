import { NextRequest, NextResponse } from "next/server";
import rateLimit from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, setAuthCookie, sanitizeUser } from '@/lib/auth-helper';
import { logAudit } from "@/lib/audit";
import { withLogging } from '@/lib/api-handler';

const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 500, 
});

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown_ip';
    try {
        // Batasi maksimal 5 percobaan per IP Address dalam interval waktu di atas
        await limiter.check(5, ip);
      } catch {
        // Jika melebihi 5 kali, langsung tolak tanpa menyentuh Database (Menghemat resource)
        return NextResponse.json(
          { message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.' },
          { status: 429 } 
        );
      }

    const body = await req.json();
    const { email, password, rememberMe } = body;

    // 1. Cari User + Role + Status
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

    // 3. Validasi Status
    // Hanya blokir jika 'INACTIVE'. Onboarding/OnLeave tetap boleh masuk.
    if (user.status === 'INACTIVE') {
      return NextResponse.json({
        message: `Access denied. Your account has been deactivated by Admin.`,
      }, { status: 403 });
    }

    const tokenPayload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role.name,
      status: user.status
    };

    const token = await signToken(tokenPayload, rememberMe);
    const cookie = setAuthCookie(token, rememberMe);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await logAudit(user.id, user.id, 'USER_SIGNIN_SUCCESS', { method: 'email/password' });

    const safeUser = sanitizeUser({
      ...user,
      role: user.role.name 
    });

    const response = NextResponse.json({
      message: 'Login successful.',
      token, 
      role: user.role.name,
      user: safeUser
    }, { status: 200 });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Error in signIn:', error);
    return NextResponse.json({ message: 'Server error during login.' }, { status: 500 });
  }
});