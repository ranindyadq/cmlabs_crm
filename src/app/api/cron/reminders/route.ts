import { NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/services/reminder.service';

// Opsional: Set max duration agar tidak timeout (Vercel Pro max 300s, Hobby 10s)
export const maxDuration = 10; 
export const dynamic = 'force-dynamic'; // Pastikan tidak di-cache

export async function GET(req: Request) {
  // 1. Keamanan: Cek Header Authorization dari Vercel
  const authHeader = req.headers.get('authorization');
  
  // ⚠️ PERBAIKAN DI SINI: Gunakan Backticks (`) bukan kutip satu (') atau tanpa kutip
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Jalankan Logika Reminder
    await checkAndSendReminders();
    
    return NextResponse.json({ success: true, message: 'Reminders processed' });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}