export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    
    // Cek apakah kita sedang di Local Development
    // Vercel selalu set NODE_ENV=production saat deploy
    if (process.env.NODE_ENV === 'development') { 
        
        const { startReminderScheduler } = await import('./services/reminder.service');

        // Singleton check untuk hot-reload di dev
        if (!(global as any).reminderSchedulerStarted) {
            console.log("🚀 [LOCAL MODE] Starting Reminder Scheduler (Node-Cron)...");
            startReminderScheduler();
            (global as any).reminderSchedulerStarted = true;
        }
    } else {
        console.log("☁️ [PRODUCTION MODE] Scheduler disabled. Waiting for Vercel Cron trigger.");
    }
  }
}