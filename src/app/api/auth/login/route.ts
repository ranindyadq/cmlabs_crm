import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from 'cookie';
import { JWT_SECRET } from '@/lib/constants';
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
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
    
    const MAX_AGE_NORMAL = 60 * 60 * 8; 
    const MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; 
    const tokenDuration = rememberMe ? '30d' : '8h';
    const cookieDuration = rememberMe ? MAX_AGE_REMEMBER : MAX_AGE_NORMAL;

    // 4. Generate JWT
    const token = jwt.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: user.role.name,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: tokenDuration }
    );

    // 5. Set Cookie (HttpOnly)
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieDuration,
    });

    // 6. Update Last Login & Audit
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await logAudit(user.id, user.id, 'USER_SIGNIN_SUCCESS', { method: 'email/password' });

    // 7. RETURN RESPONSE
    const response = NextResponse.json({
      message: 'Login successful.',
      token, 
      role: user.role.name,
      user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role.name,
          status: user.status,
          photo: user.photo || null 
      }
    }, { status: 200 });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Error in signIn:', error);
    return NextResponse.json({ message: 'Server error during login.' }, { status: 500 });
  }
}