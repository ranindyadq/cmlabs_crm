// src/app/api/calls/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust based on your prisma location
import { getSessionUser } from "@/lib/auth-helper";

// PATCH: Update a specific Call
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // This is the CALL ID
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existingCall = await prisma.call.findUnique({
      where: { id },
    });

    if (!existingCall) return NextResponse.json({ message: "Call not found" }, { status: 404 });

    // Optional: Add strict ownership check here if needed
    // if (user.role !== 'ADMIN' && existingCall.userId !== user.id) ...

    const body = await req.json();
    
    // Remove fields that shouldn't be updated loosely if necessary
    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        title: body.title,
        notes: body.notes,
        callTime: body.callTime,
        status: body.status,
        result: body.result
      },
    });

    return NextResponse.json({ message: "Call updated", data: updatedCall });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

// DELETE: Remove a specific Call
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