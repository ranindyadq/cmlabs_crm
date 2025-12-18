import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ message: 'Token diperlukan.' }, { status: 400 });

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

    if (!resetRecord) {
      return NextResponse.json({ message: 'Link tidak valid.' }, { status: 400 });
    }
    if (resetRecord.used) {
      return NextResponse.json({ message: 'Link reset sudah digunakan.' }, { status: 400 });
    }
    if (resetRecord.expiresAt.getTime() <= new Date().getTime()) {
      return NextResponse.json({ message: 'Link reset kedaluwarsa.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Token valid.', userId: resetRecord.userId }, { status: 200 });

  } catch (error) {
    console.error('Error in password-reset/validate:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}