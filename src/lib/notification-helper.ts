import { prisma } from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR"; // Sesuaikan dengan kebutuhan
  leadId?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  leadId,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        leadId,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    // Kita tidak throw error agar proses bisnis utama (misal: save meeting) tidak gagal cuma karena notif error
    return null;
  }
}