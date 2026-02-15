import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
// 1. IMPORT ENUM DARI PRISMA CLIENT
import { CallStatus, CallDirection } from "@prisma/client"; 

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 1. Cek Permission
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true } });
    if (!lead) return NextResponse.json({ message: "Lead not found" }, { status: 404 });

    if (user.role !== 'ADMIN' && lead.ownerId !== user.id) {
       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    
    const body = await req.json();

    // === 2. SANITASI DATA DENGAN TIPE ENUM YANG BENAR ===
    
    // DIRECTION: Validasi apakah string input ada di dalam Enum CallDirection
    let cleanDirection: CallDirection | null = null;
    
    if (body.direction && body.direction.trim() !== "") {
        const inputDir = body.direction.toUpperCase();
        // Cek apakah inputDir adalah salah satu value dari CallDirection
        if (Object.values(CallDirection).includes(inputDir as CallDirection)) {
            cleanDirection = inputDir as CallDirection;
        }
    }

    // STATUS: Default ke Enum SCHEDULED
    let cleanStatus: CallStatus = CallStatus.SCHEDULED;
    
    if (body.status && body.status.trim() !== "") {
        const inputStatus = body.status.toUpperCase();
        // Cek apakah inputStatus valid di CallStatus
        if (Object.values(CallStatus).includes(inputStatus as CallStatus)) {
            cleanStatus = inputStatus as CallStatus;
        }
    }

    // CONTACT: Ubah string kosong "" menjadi null
    const cleanContactId = body.contactId && body.contactId.trim() !== "" ? body.contactId : null;

    // DATE & TIME
    if (!body.callTime) {
        return NextResponse.json({ message: "Call time is required" }, { status: 400 });
    }

    // === 3. SIMPAN KE DATABASE ===
    const newCall = await prisma.call.create({
      data: {
        title: body.title,
        notes: body.notes,
        
        callTime: new Date(body.callTime), 
        durationMinutes: parseInt(body.durationMinutes) || 15, 
        
        status: cleanStatus,       // Sekarang tipe-nya sudah CallStatus (Bukan string)
        direction: cleanDirection, // Sekarang tipe-nya CallDirection | null
        result: body.result,
        
        contactId: cleanContactId,
        
        leadId: leadId,
        userId: user.id
      }
    });

    return NextResponse.json({ data: newCall }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Error creating call:", error);
    return NextResponse.json({ 
        message: "Internal Error", 
        error: error.message || "Database constraint failed" 
    }, { status: 500 });
  }
}

// Handler GET tetap sama
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
      const user = await getSessionUser(req);
      if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
      const calls = await prisma.call.findMany({
        where: { leadId: params.id },
        orderBy: { callTime: 'desc' },
        include: {
          contact: true
        }
      });
  
      return NextResponse.json({ message: "Calls fetched", data: calls });
    } catch (error) {
      return NextResponse.json({ message: "Error fetching calls" }, { status: 500 });
    }
}