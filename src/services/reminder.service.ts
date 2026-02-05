import cron from 'node-cron';
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-helper"; // Import Helper tadi

// Helper Internal: Proses Notifikasi
const processActivityReminders = async (activities: any[], type: 'Meeting' | 'Call') => {
  const isMeeting = type === 'Meeting';
  
  const timeField = isMeeting ? 'startTime' : 'callTime';
  const recipientField = isMeeting ? 'organizerId' : 'userId';
  const titleField = 'title'; // Asumsi field judul di tabel Meeting/Call adalah 'title'

  for (const activity of activities) {
    const now = new Date();
    const activityTime = new Date(activity[timeField]);
    
    // Hitung waktu reminder (Activity Time - Menit Reminder)
    const reminderTime = new Date(
      activityTime.getTime() - (activity.reminderMinutesBefore * 60000)
    );

    // Cek apakah sekarang sudah waktunya (atau sudah lewat)
    if (now >= reminderTime) {
      try {
        // Format jam agar mudah dibaca user (contoh: 14:30)
        const timeString = activityTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // 🔥 GUNAKAN HELPER (Lebih Rapi & Konsisten)
        await createNotification({
          userId: activity[recipientField],
          // Kita manfaatkan field TITLE agar bold di notifikasi
          title: `Reminder: ${activity[titleField] || type}`, 
          // Message berisi detail waktunya
          message: `${type} akan dimulai sebentar lagi pada pukul ${timeString}. Persiapkan diri Anda.`,
          type: 'WARNING', // Gunakan tipe WARNING untuk reminder agar icon/warnanya bisa dibedakan nanti
          leadId: activity.leadId,
        });

        // Update status agar tidak dikirim ulang (Looping prevention)
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
  try {
    const now = new Date();

    // 1. Ambil Meeting yang belum diingatkan & waktunya belum lewat jauh (opsional: tambah range)
    const meetings = await prisma.meeting.findMany({
      where: {
        reminderSent: false,
        reminderMinutesBefore: { not: null },
        // Pastikan meetingnya belum selesai (atau masih di masa depan) agar tidak menotif meeting tahun lalu
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
    
  } catch (error) {
      console.error("Error in checkAndSendReminders scheduler:", error);
  }
};

// Fungsi Start untuk Localhost (Node-cron)
export const startReminderScheduler = () => {
  // Jalankan setiap menit
  cron.schedule('* * * * *', () => {
      console.log("⏰ Checking reminders...");
      checkAndSendReminders();
  });
  console.log("✅ Scheduler Reminder Service started.");
};