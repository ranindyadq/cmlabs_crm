import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose'; // Gunakan jose karena middleware Next.js berjalan di Edge Runtime

const secretString = process.env.JWT_SECRET;
if (!secretString) throw new Error("JWT_SECRET is missing");
const JWT_SECRET = new TextEncoder().encode(secretString);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value; // Mengambil token dari cookie
  const { pathname } = req.nextUrl;

  // 1. Izinkan akses ke halaman login dan signup (jika masih ada)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }

  // 2. Proteksi Rute Internal (Folder dashboard)
  if (pathname.startsWith('/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Verifikasi JWT
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      const userRole = payload.role as string;

      // 3. Batasi Akses Menu Team Management (Hanya ADMIN/OWNER)
      // Sesuai requirement: Sales hanya bisa akses leads miliknya [cite: 1493, 1526]
      if (pathname.startsWith('/team') && userRole !== 'ADMIN' && userRole !== 'OWNER') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      return NextResponse.next();
    } catch (err) {
      // Token tidak valid atau expired
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

// Konfigurasi matcher untuk menentukan rute mana yang diproteksi
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};