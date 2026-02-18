export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Import Winston (Hanya di runtime nodejs)
    const logger = (await import('./lib/logger')).default;
    
    logger.info(`🏗️ Application starting in ${process.env.NODE_ENV} mode...`);

    if (process.env.NODE_ENV === 'development') { 
        const { startReminderScheduler } = await import('./services/reminder.service');

        if (!(global as any).reminderSchedulerStarted) {
            logger.info("🚀 [LOCAL MODE] Starting Reminder Scheduler (Node-Cron)...");
            startReminderScheduler();
            (global as any).reminderSchedulerStarted = true;
        }
    } else {
        logger.info("☁️ [PRODUCTION MODE] Scheduler disabled. Waiting for Vercel Cron trigger.");
    }
  }
}