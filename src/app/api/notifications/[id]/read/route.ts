import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const notificationId = params.id;

    // Gunakan updateMany dengan filter userId untuk keamanan
    // (Agar user A tidak bisa memark-read notifikasi milik user B)
    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id, // Kunci keamanan
      },
      data: {
        isRead: true,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Marked as read" });

  } catch (error) {
    console.error("Error marking read:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}