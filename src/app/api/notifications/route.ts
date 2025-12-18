import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  try {
    // 1. Cek User Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Jalankan Query secara Paralel (Lebih Cepat)
    // Kita mengambil data list DAN menghitung jumlah unread sekaligus
    const [notifications, unreadCount] = await Promise.all([
      // A. Ambil 10 notifikasi terbaru
      prisma.notification.findMany({
        where: {
          userId: user.id,
          // Opsional: Hapus 'isRead: false' jika ingin menampilkan history semua notif (termasuk yg sudah dibaca)
          // isRead: false, 
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: { id: true, title: true } // Sertakan Info Lead
          }
        }
      }),

      // B. Hitung total yang belum dibaca (untuk badge merah di lonceng)
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false
        }
      })
    ]);

    // 3. Return Response
    return NextResponse.json({
      data: notifications,
      unreadCount: unreadCount
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}