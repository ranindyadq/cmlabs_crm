import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getGoogleUserFromCode } from "@/lib/google"; // Helper baru kita
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_crm_dua_puluh_lima';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function logAudit(actorId: string | null, targetId: string | null, actionType: string, details: any) {
  try {
    await prisma.auditLog.create({
      data: { actorId, targetId, actionType, detailsJson: details || {} },
    });
  } catch (err) { console.error(`Audit Log Failed:`, err); }
}

export async function GET(req: Request) {
  try {
    // 1. Ambil "code" dari URL
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=no_code`);
    }

    // 2. Tukar Code -> Data User (Pengganti Passport Middleware)
    const googleUser = await getGoogleUserFromCode(code);
    
    // LOGIKA BISNIS: Upsert User (Cari atau Buat)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email }
        ]
      },
      include: { role: { select: { name: true } } }
    });

    // Skenario: User Baru (Register via Google)
    if (!user) {
        const viewerRole = await prisma.role.findUnique({ where: { name: 'VIEWER' } });
        user = await prisma.user.create({
            data: {
                fullName: googleUser.name,
                email: googleUser.email,
                googleId: googleUser.id,
                photo: googleUser.picture,
                roleId: viewerRole?.id || "role-id-default",
                status: 'ACTIVE',
                isOauthUser: true,
            },
            include: { role: { select: { name: true } } }
        });
        await logAudit(user.id, user.id, 'USER_SIGNUP', { method: 'Google OAuth' });
        
        // Logic Lama: Jika Pending -> Redirect ke page pending
        return NextResponse.redirect(`${FRONTEND_URL}/auth/oauth-pending`);
    }

    // Skenario: User Lama tapi belum link Google
    if (!user.googleId) {
        await prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleUser.id, isOauthUser: true, photo: googleUser.picture }
        });
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=account_disabled`);
    } 

    // 4. Update Login & Audit
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await logAudit(user.id, user.id, 'USER_SIGNIN_SUCCESS', { method: 'Google OAuth' });

    // 5. Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    }); 

    // 6. Redirect ke Dashboard (Sesuai Logic Lama)
    const response = NextResponse.redirect(`${FRONTEND_URL}/dashboard`);
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Error in googleOAuthCallback:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
}