import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// =================================================================================
// HELPER: Cek Hak Akses (RBAC)
// =================================================================================
async function checkNoteAccess(noteId: string, user: any) {
  // 1. Cari Note di Database
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { userId: true } // Hanya butuh userId untuk validasi
  });

  // 2. Cek apakah Note ada
  if (!note) {
    return { error: "Note not found", status: 404 };
  }

  // 3. Cek Permission: Hanya ADMIN atau Pembuat Note yang boleh akses
  if (user.role !== 'ADMIN' && note.userId !== user.id) {
    return { error: "Forbidden: You do not have permission", status: 403 };
  }

  return { success: true };
}

// =================================================================================
// 1. UPDATE NOTE (PATCH)
// =================================================================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Cek Akses (Menggunakan Helper)
    const access = await checkNoteAccess(id, user);
    if (access.error) {
      return NextResponse.json({ message: access.error }, { status: access.status });
    }

    // 3. Ambil Data Body
    const body = await req.json();
    
    // Opsional: Sanitasi (Hapus field yang tidak boleh diubah manual)
    delete body.id;
    delete body.userId;
    delete body.leadId;
    delete body.createdAt;

    // 4. Update Database
    const updatedNote = await prisma.note.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      message: "Note updated successfully",
      data: updatedNote,
    });

  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// =================================================================================
// 2. DELETE NOTE (DELETE)
// =================================================================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Cek Akses (Menggunakan Helper)
    const access = await checkNoteAccess(id, user);
    if (access.error) {
      return NextResponse.json({ message: access.error }, { status: access.status });
    }

    // 3. Hapus Data (Hard Delete sesuai controller lama)
    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Note deleted successfully" });

  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}