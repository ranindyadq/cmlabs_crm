// src/instrumentation.ts

export async function register() {
  // Kita cek runtime agar cron job hanya jalan di lingkungan Node.js (bukan di Edge/Browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    
    // Import dinamis agar modul ini tidak dimuat di sisi klien
    const { startReminderScheduler } = await import('./services/reminder.service');
    
    // Jalankan Scheduler
    console.log("🚀 Starting Instrumentation: Reminder Service...");
    startReminderScheduler();
  }
}