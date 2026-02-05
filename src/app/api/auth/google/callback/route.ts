export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getGoogleUserFromCode } from "@/lib/google";
import { JWT_SECRET } from '@/lib/constants';

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
      return NextResponse.redirect(`${FRONTEND_URL}/auth/signin?error=no_code`);
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

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role.name, status: user.status },
            JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Arahkan ke halaman penangkap token, tapi kasih info kalau ini user baru
        const callbackUrl = new URL(`${FRONTEND_URL}/auth/social-callback`);
        callbackUrl.searchParams.set('token', token);
        callbackUrl.searchParams.set('role', user.role.name);
        callbackUrl.searchParams.set('name', user.fullName);
        callbackUrl.searchParams.set('new_user', 'true'); // Penanda user baru
        
        return NextResponse.redirect(callbackUrl);
    }

    // Skenario: User Lama tapi belum link Google
    if (!user.googleId) {
        await prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleUser.id, isOauthUser: true, photo: googleUser.picture }
        });
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.redirect(`${FRONTEND_URL}/auth/signin?error=account_disabled`);
    } 

    // 4. Update Login & Audit
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    await logAudit(user.id, user.id, 'USER_SIGNIN_SUCCESS', { method: 'Google OAuth' });

    // 5. Generate Token
    const token = jwt.sign(
      { 
        id: user.id,
        sub: user.id,
        email: user.email,
        role: user.role.name,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Kita arahkan ke halaman "Penangkap Token" di frontend
    const callbackUrl = new URL(`${FRONTEND_URL}/auth/social-callback`);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('role', user.role.name);
    callbackUrl.searchParams.set('name', user.fullName);

    return NextResponse.redirect(callbackUrl);

  } catch (error) {
    console.error('Error in googleOAuthCallback:', error);
    return NextResponse.redirect(`${FRONTEND_URL}/auth/signin?error=oauth_failed`);
  }
}