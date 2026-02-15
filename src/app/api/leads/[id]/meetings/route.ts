import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// GET: Ambil List Meeting
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const meetings = await prisma.meeting.findMany({
      where: { leadId: params.id },
      orderBy: { startTime: 'desc' },
      include: {
        // 1. Organizer
        organizer: { 
            select: { fullName: true, email: true, photo: true }
        },
        
        // 2. Attendees (Ditaruh DI DALAM include, sejajar dengan organizer)
        attendees: {
          select: {
            userId: true, // Penting untuk checkbox
            user: {
              select: { fullName: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ message: "Meetings fetched", data: meetings });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching meetings" }, { status: 500 });
  }
}

// POST: Buat Meeting Baru
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const user = await getSessionUser(request);
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Please login first" }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
    if (!lead) return NextResponse.json({ message: "Lead not found" }, { status: 404 });

    // RBAC Check
    if (user.role !== 'ADMIN' && lead.ownerId !== user.id) {
       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();

    // Validasi
    if (!body.title || !body.startTime || !body.endTime) {
      return NextResponse.json({ message: "Title, Start Time, and End Time are required" }, { status: 400 });
    }

    const attendeeIds: string[] = body.attendeeIds || [];

    // Simpan ke Database
    const newMeeting = await prisma.meeting.create({
      data: {
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        timezone: body.timezone || "Asia/Jakarta",
        
        location: body.location,
        meetingLink: body.meetingLink,
        outcome: body.outcome,
        reminderMinutesBefore: body.reminderMinutesBefore ? parseInt(body.reminderMinutesBefore) : 15,
        
        // Relasi
        leadId: leadId,
        organizerId: user.id, // Gunakan ID dari session

        attendees: {
          create: attendeeIds.map((id) => ({
            user: { connect: { id: id } } // Hubungkan ke ID User yang ada di tabel User
          }))
        }
      },
      include: {
        attendees: {
          include: { user: { select: { id: true, fullName: true, email: true } } }
        }
      }
    });

    return NextResponse.json(
      { message: "Meeting created successfully", data: newMeeting },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ ERROR BACKEND MEETING:", error);
    return NextResponse.json(
      { message: "Internal server error", errorDetail: error.message },
      { status: 500 }
    );
  }
}