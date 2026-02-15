import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// --- EDIT TEAM MEMBER (PATCH/PUT) ---
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    
    // 1. Cek User Null
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ekstrak Role dengan Aman (Fix Error 'never')
    const roleData = user.role as any;
    const userRole = typeof roleData === 'string' ? roleData : roleData?.name;

    // 3. Cek Permission (Admin & Owner Only)
    const allowedEditors = ['ADMIN', 'OWNER'];

    if (!userRole || !allowedEditors.includes(userRole.toUpperCase())) {
        return NextResponse.json({ message: "Forbidden: You cannot edit team members." }, { status: 403 });
    }

    const id = params.id;
    const body = await req.json();
    const { 
        fullName, status, phone, roleName, managerId,
        department, roleTitle, bio, skills, location, joinedAt 
    } = body;

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
        managerId: managerId || null,
        ...roleUpdate,
        workInfo: {
          upsert: {
            create: { 
              department, 
              roleTitle,
              joinedAt: new Date(), // Opsional: set default joinedAt jika baru dibuat
              bio,
              location,
              skills: Array.isArray(skills) ? skills : [],
            },
            update: { department, 
              roleTitle,
              bio,
              location,
              skills: Array.isArray(skills) ? skills : [], 
            ...(joinedAt && { joinedAt: new Date(joinedAt) })
           }
          }
        }
      }
    });

    return NextResponse.json({ message: "Team member data updated.", data: updatedUser });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ message: "Failed to update data." }, { status: 500 });
  }
}

// --- DELETE TEAM MEMBER (SOFT DELETE) ---
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    
    // 1. Cek User Null
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ekstrak Role dengan Aman
    const roleData = user.role as any;
    const userRole = typeof roleData === 'string' ? roleData : roleData?.name;

    // 3. Cek Permission (Admin & Owner Only)
    const allowedDeleters = ['ADMIN', 'OWNER'];

    if (!userRole || !allowedDeleters.includes(userRole.toUpperCase())) {
        return NextResponse.json({ message: "Forbidden: You cannot delete team members." }, { status: 403 });
    }

    const id = params.id;

    if (user.id === id) {
        return NextResponse.json({ message: "You cannot delete your own account." }, { status: 400 });
    }
    
    // 1. Cek apakah user punya Lead yang masih aktif (Optional tapi bagus)
  const activeLeads = await prisma.lead.count({
    where: { 
      ownerId: params.id,
      status: 'ACTIVE' // Sesuaikan dengan enum LeadStatus Anda
    }
  });

  if (activeLeads > 0) {
    return NextResponse.json({ 
      message: `User ini masih memiliki ${activeLeads} Lead aktif. Harap pindahkan (re-assign) Lead terlebih dahulu sebelum menonaktifkan akun.` 
    }, { status: 400 });
  }

  // 2. Lakukan Soft Delete (Non-aktifkan)
  await prisma.user.update({
    where: { id: params.id },
    data: {
      status: 'INACTIVE', // Atau status khusus 'DELETED' jika ada
      deletedAt: new Date(), // Tandai waktu penghapusan
      // Opsional: Kosongkan token login agar dia langsung logout
    }
  });

    return NextResponse.json({ message: "Team member successfully deleted (soft delete)." });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ message: "Failed to delete team member." }, { status: 500 });
  }
}