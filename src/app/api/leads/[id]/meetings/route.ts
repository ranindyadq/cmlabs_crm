import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-helper"; // <--- PASTIKAN IMPORT INI ADA

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;

    // 1. AUTHENTICATION CHECK (Perbaikan Utama)
    // Kita ambil user yang sedang login
    const user = await getSessionUser(request);
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Please login first" }, { status: 401 });
    }

    const organizerId = user.id; // <--- GUNAKAN ID ASLI DARI SESSION

    // 2. Ambil Data Body
    const body = await request.json();
    const { 
      title, 
      startTime, 
      endTime, 
      location, 
      meetingLink, 
      description 
    } = body;

    // 3. Validasi
    if (!title || !startTime) {
      return NextResponse.json(
        { message: "Title and Start Time are required" }, 
        { status: 400 }
      );
    }

    // 4. Simpan ke Database
    const newMeeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime 
        ? new Date(endTime) 
        : new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
        location,
        meetingLink,
        // Relasi ke Lead
        lead: { connect: { id: leadId } },
        // Relasi ke User (Organizer) menggunakan ID asli
        organizer: { connect: { id: organizerId } }, 
      },
    });

    return NextResponse.json(
      { message: "Meeting created successfully", data: newMeeting },
      { status: 201 }
    );

  } catch (error: any) {
    // Log error detail ke Terminal VS Code (Bukan Console Browser)
    console.error("❌ ERROR BACKEND:", error);
    
    return NextResponse.json(
      { message: "Internal server error", errorDetail: error.message },
      { status: 500 }
    );
  }
}