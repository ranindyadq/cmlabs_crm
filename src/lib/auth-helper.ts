import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/constants';
import { cookies } from 'next/headers';
import { serialize } from 'cookie'; 
import { SignJWT } from 'jose';

// Definisi Tipe User agar autocompletion jalan di file lain
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string; // Status penting untuk logika login
}
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
    try {
    // 1. Ambil Token
    const cookieStore = cookies();
    let token = cookieStore.get('token')?.value;

    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) return null; 

    // 2. Verifikasi Token
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub || decoded.id; 

    // 3. Cari User di DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    // Sesuai requirement, user ada status 'INACTIVE'.
    // Kita harus blokir login jika INACTIVE. 
    // Tapi 'ONBOARDING' atau 'ON_LEAVE' biasanya masih boleh login (hanya akses terbatas).
    if (!user || user.status === 'INACTIVE') { 
      return null;
    }

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role.name,
      status: user.status, // status agar bisa dipakai di UI
    };

  } catch (error) {
    // console.error("Auth Helper Error:", error); // Boleh di-uncomment untuk debugging
    return null;
  }
}

// ==========================================
// 2. HELPER: MEMBUAT TOKEN & COOKIE (BARU)
// ==========================================
export async function signToken(payload: any, rememberMe: boolean = false) {
  const tokenDuration = rememberMe ? '30d' : '8h';

  const secretKey = new TextEncoder().encode(JWT_SECRET);
  
  // Menggunakan jose agar lebih aman & Edge-compatible
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(tokenDuration)
    .sign(secretKey);
}

export function setAuthCookie(token: string, rememberMe: boolean = false) {
  const MAX_AGE_NORMAL = 60 * 60 * 8;      // 8 Jam
  const MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 Hari
  
  return serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? MAX_AGE_REMEMBER : MAX_AGE_NORMAL,
  });
}

// ==========================================
// 3. HELPER: MEMBERSIHKAN DATA SENSITIF (BARU)
// ==========================================
export function sanitizeUser(user: any) {
  const { passwordHash, ...safeUser } = user; // Hapus password dari objek
  return safeUser;
}

// PERMISSION HELPERS
// Gunakan fungsi-fungsi ini di API Route Anda nanti.

/**
 * Cek apakah user adalah ADMIN.
 * Digunakan untuk modul Team Management & Delete Data.
 */
export function requireAdmin(user: SessionUser | null) {
  return user && user.role === 'ADMIN';
}

/**
 * Logika "Siapa yang boleh akses data ini?" (Lead/Note/Meeting)
 * - Admin: Boleh akses SEMUA data.
 * - Sales: HANYA boleh akses data miliknya sendiri (resourceOwnerId).
 * - Viewer: Tidak boleh akses apa-apa (biasanya).
 * * Sesuai Requirement: "Sales hanya untuk leads yang ditugaskan" 
 */
export function checkResourceAccess(user: SessionUser | null, resourceOwnerId: string | null) {
  if (!user) return false;

  // 1. Admin Dewa (Bisa segalanya)
  if (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'PROJECT MANAGER') return true;

  // 2. Sales Cek Kepemilikan
  if (user.role === 'SALES') {
    // Jika dia pemilik data (ownerId sama dengan userId), BOLEH.
    return user.id === resourceOwnerId;
  }

  // 3. Role Lain (Viewer) -> Default False (Tolak)
  return false;
}

/**
 * Cek apakah User boleh mengedit profil.
 * Sesuai Requirement: "User dapat mengubah informasi profil kecuali role dan email"
 */
export function canEditProfile(currentUser: SessionUser, targetUserId: string) {
  if (currentUser.role === 'ADMIN') return true; // Admin bisa edit siapa saja
  return currentUser.id === targetUserId; // User biasa cuma bisa edit diri sendiri
}