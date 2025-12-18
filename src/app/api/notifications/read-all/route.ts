import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    // 1. Cek User Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Update massal (Batch Update)
    // Mengubah semua notifikasi milik user ini yang masih 'false' menjadi 'true'
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ 
      message: "All notifications marked as read",
      count: result.count // Info berapa banyak yang diupdate (opsional)
    });

  } catch (error) {
    console.error("Error marking all read:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}