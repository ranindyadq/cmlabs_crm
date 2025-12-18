import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// --- EDIT TEAM MEMBER (PATCH/PUT) ---
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } } 
) {
  try {
    // 🔒 Security Check (Only Admin)
    const user = await getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const id = params.id;
    const body = await req.json();
    const { fullName, status, phone, department, roleTitle, roleName } = body;

    // Update role jika ada
    let roleUpdate = {};
    if (roleName) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) roleUpdate = { roleId: role.id };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        status,
        phone,
        ...roleUpdate,
        workInfo: {
          upsert: {
            create: { 
              department, 
              roleTitle,
              joinedAt: new Date() // Opsional: set default joinedAt jika baru dibuat
            },
            update: { department, roleTitle }
          }
        }
      }
    });

    return NextResponse.json({ message: "Data anggota tim diperbarui.", data: updatedUser });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ message: "Gagal memperbarui data." }, { status: 500 });
  }
}

// --- DELETE TEAM MEMBER (SOFT DELETE) ---
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 🔒 Security Check (Only Admin)
    const user = await getSessionUser(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // ✅ Logic: Jangan hapus diri sendiri
    if (user.id === id) {
        return NextResponse.json({ message: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { 
        status: 'INACTIVE',
        deletedAt: new Date() 
      }
    });

    return NextResponse.json({ message: "Anggota tim berhasil dihapus (soft delete)." });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ message: "Gagal menghapus anggota tim." }, { status: 500 });
  }
}