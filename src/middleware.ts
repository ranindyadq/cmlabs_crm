import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes yang butuh autentikasi
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/team',
  '/lead',
  '/contacts',
  '/companies',
  '/settings',
  '/global-search',
];

// Routes auth (login, signup, dll)
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/set-new-password',
  '/auth/check-email',
  '/auth/reset-status',
];

const allowedOrigins = ['http://localhost:3000', 'https://cmlabs-crm-7.vercel.app'];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();

  // Jika origin ada dalam daftar yang diizinkan
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
  
  const { pathname } = request.nextUrl;
  
  // Skip API routes dan static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') // static files (.svg, .png, etc)
  ) {
    return NextResponse.next();
  }

  // Ambil token dari cookies
  const token = request.cookies.get('token')?.value;

  // 1. CEK PROTECTED ROUTES
  // Jika user belum login tapi akses halaman protected -> redirect ke signin
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute && !token) {
    const signinUrl = new URL('/auth/signin', request.url);
    // Simpan URL asal agar bisa redirect kembali setelah login
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // 2. CEK AUTH ROUTES
  // Jika user sudah login tapi akses halaman auth -> redirect ke dashboard
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi path yang kena middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
