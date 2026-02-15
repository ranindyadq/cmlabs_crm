import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
// 1. JANGAN LUPA IMPORT ENUM
import { CallStatus, CallDirection } from "@prisma/client";

// PATCH: Update a specific Call
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; 
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existingCall = await prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) return NextResponse.json({ message: "Call not found" }, { status: 404 });

    if (user.role !== 'ADMIN' && existingCall.userId !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    // === SANITASI DATA UPDATE (SAMA SEPERTI POST) ===

    // 1. Validasi Status (Jika dikirim)
    let cleanStatus = undefined;
    if (body.status !== undefined) {
        if (body.status && body.status.trim() !== "") {
            const inputStatus = body.status.toUpperCase();
            if (Object.values(CallStatus).includes(inputStatus as CallStatus)) {
                cleanStatus = inputStatus as CallStatus;
            }
        }
    }

    // 2. Validasi Direction (Jika dikirim)
    let cleanDirection = undefined;
    if (body.direction !== undefined) { // Cek apakah field dikirim di payload
        if (body.direction && body.direction.trim() !== "") {
            const inputDir = body.direction.toUpperCase();
            if (Object.values(CallDirection).includes(inputDir as CallDirection)) {
                cleanDirection = inputDir as CallDirection;
            }
        } else {
            cleanDirection = null; // Jika string kosong, set null
        }
    }

    // 3. Contact ID
    let cleanContactId = undefined;
    if (body.contactId !== undefined) {
        cleanContactId = body.contactId && body.contactId.trim() !== "" ? body.contactId : null;
    }

    // === UPDATE DATABASE ===
    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        title: body.title,
        notes: body.notes,
        callTime: body.callTime ? new Date(body.callTime) : undefined,
        
        // Field Angka
        durationMinutes: body.durationMinutes ? parseInt(body.durationMinutes) : undefined,

        // Field Enum & Relasi (Gunakan value yang sudah disanitasi)
        // Jika undefined, Prisma tidak akan mengupdate field tersebut (tetap pakai data lama)
        status: cleanStatus, 
        direction: cleanDirection, 
        contactId: cleanContactId,
        
        result: body.result
      },
    });

    return NextResponse.json({ message: "Call updated", data: updatedCall });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ 
        message: "Internal Error",
        error: error.message || "Database error"
    }, { status: 500 });
  }
}

// DELETE: Remove a specific Call (Tetap sama)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await prisma.call.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Call deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}