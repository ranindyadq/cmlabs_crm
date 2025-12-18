import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// 1. Pastikan secret diambil di awal dan divalidasi
const JWT_SECRET = process.env.JWT_SECRET;

export async function getSessionUser(req: Request) {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];

    // 2. Verifikasi (Gunakan secret yang sudah divalidasi di atas)
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // 3. Cari User di DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
    };
  } catch (error) {
    return null;
  }
}

// Helper untuk cek Admin
export function requireAdmin(user: any) {
  return user && user.role === 'ADMIN';
}