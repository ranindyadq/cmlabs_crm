import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// PATCH: Update Meeting
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existingMeeting = await prisma.meeting.findUnique({ where: { id } });
    if (!existingMeeting) return NextResponse.json({ message: "Meeting not found" }, { status: 404 });

    // Cek Permission (Hanya Admin atau Organizer yang bisa edit)
    if (user.role !== 'ADMIN' && existingMeeting.organizerId !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        location: body.location,
        meetingLink: body.meetingLink,
        outcome: body.outcome,
        timezone: body.timezone,
        reminderMinutesBefore: body.reminderMinutesBefore ? parseInt(body.reminderMinutesBefore) : undefined,
      },
    });

    return NextResponse.json({ message: "Meeting updated", data: updatedMeeting });
  } catch (error: any) {
    console.error("Update Meeting Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

// DELETE: Hapus Meeting
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Cek Permission
    const existingMeeting = await prisma.meeting.findUnique({ where: { id } });
    if (!existingMeeting) return NextResponse.json({ message: "Not Found" }, { status: 404 });

    if (user.role !== 'ADMIN' && existingMeeting.organizerId !== user.id) {
       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.meeting.delete({ where: { id } });

    return NextResponse.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}