export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const logger = (await import('./lib/logger')).default;
    
    logger.info(`🏗️ Application starting in ${process.env.NODE_ENV} mode...`);

    if (process.env.NODE_ENV === 'development') { 
        const { startReminderScheduler } = await import('./services/reminder.service');

        if (!(global as any).reminderSchedulerStarted) {
            logger.info("🚀 [LOCAL MODE] Starting Scheduler...");
            startReminderScheduler();
            (global as any).reminderSchedulerStarted = true;
        }
    } else {
        // Di Vercel, gunakan Vercel Cron Jobs daripada node-cron
        logger.info("☁️ [PRODUCTION] Scheduler disabled. Waiting for Vercel Cron.");
    }
  }
}