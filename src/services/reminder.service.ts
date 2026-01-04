import cron from 'node-cron';
import { prisma } from "@/lib/prisma"; 

// Helper: Proses Notifikasi
const processActivityReminders = async (activities: any[], type: 'Meeting' | 'Call') => {
  const isMeeting = type === 'Meeting';
  
  const timeField = isMeeting ? 'startTime' : 'callTime';
  const recipientField = isMeeting ? 'organizerId' : 'userId';
  const messagePart = isMeeting ? 'Meeting' : 'Panggilan terjadwal';
  const titleField = 'title';

  for (const activity of activities) {
    const now = new Date();
    const activityTime = new Date(activity[timeField]);
    
    const reminderTime = new Date(
      activityTime.getTime() - (activity.reminderMinutesBefore * 60000)
    );

    if (now >= reminderTime) {
      try {
        // ✅ PERBAIKAN DI SINI: Hapus 'title' dan masukkan infonya ke 'message'
        await prisma.notification.create({
          data: {
            userId: activity[recipientField],
            leadId: activity.leadId,
            // HAPUS BARIS INI: title: `Reminder: ${type}`, 
            // GABUNGKAN KE MESSAGE:
            message: `[Reminder: ${type}] ${messagePart} "${activity[titleField]}" akan dimulai pukul ${activityTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
            isRead: false
          }
        });

        if (isMeeting) {
            await prisma.meeting.update({
                where: { id: activity.id },
                data: { reminderSent: true }
            });
        } else {
            await prisma.call.update({
                where: { id: activity.id },
                data: { reminderSent: true }
            });
        }
        
        console.log(`-> 🔔 Reminder sent for ${type} ID: ${activity.id}`);

      } catch (error) {
        console.error(`Gagal memproses reminder ${type} ID ${activity.id}:`, error);
      }
    }
  }
};

export const checkAndSendReminders = async () => {
  const now = new Date();

  // 1. Ambil Meeting
  const meetings = await prisma.meeting.findMany({
    where: {
      reminderSent: false,
      reminderMinutesBefore: { not: null },
      startTime: { gt: now } 
    }
  });

  // 2. Ambil Call
  const calls = await prisma.call.findMany({
    where: {
      reminderSent: false,
      reminderMinutesBefore: { not: null },
      callTime: { gt: now }
    }
  });

  if (meetings.length > 0) await processActivityReminders(meetings, 'Meeting');
  if (calls.length > 0) await processActivityReminders(calls, 'Call');
};


// Fungsi Start untuk Localhost (Node-cron)
export const startReminderScheduler = () => {
  cron.schedule('* * * * *', checkAndSendReminders);
  console.log("⏰ Scheduler Reminder Service started (Local Mode).");
};