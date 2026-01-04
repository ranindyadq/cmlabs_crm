import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// ============================================================================
// HELPER: Build Dynamic Include
// (Digunakan untuk memuat data relasi secara dinamis berdasarkan query params)
// ============================================================================
const buildLeadInclude = (searchParams: URLSearchParams) => {
  const activity_search = searchParams.get('activity_search');
  const activity_type = searchParams.get('activity_type'); // NOTE, MEETING, CALL, EMAIL

  // Filter pencarian teks di dalam aktivitas
  const searchCondition = activity_search 
    ? { contains: activity_search, mode: 'insensitive' as const } 
    : undefined;

  const activityWhere: any = {
    notes: { content: searchCondition },
    meetings: { title: searchCondition },
    calls: { notes: searchCondition },
    emails: { OR: [{ subject: searchCondition }, { body: searchCondition }] },
    invoices: { invoiceNumber: searchCondition },
  };

  // Default Include (Owner, Contact, Company, Labels, Followers)
  const includeCondition: any = {
    owner: { select: { fullName: true, email: true } },
    contact: true,
    company: true,
    labels: { include: { label: true } },
    followers: { select: { id: true, fullName: true } },
    customFieldValues: { include: { field: true } },
  };

  // Logika Filter Jenis Aktivitas
  // Jika activity_type spesifik dipilih, hanya muat itu. Jika tidak, muat semua.
  
  if (!activity_type || activity_type === 'NOTE') {
    includeCondition.notes = { where: activityWhere.notes, orderBy: { createdAt: 'desc' } };
  }
  
  if (!activity_type || activity_type === 'MEETING') {
    includeCondition.meetings = { 
      where: activityWhere.meetings, 
      orderBy: { startTime: 'desc' },
      include: {
        organizer: { select: { id: true, fullName: true } },
        attendees: { select: { user: { select: { id: true, fullName: true } } } }
      }
    };
  }

  if (!activity_type || activity_type === 'CALL') {
    includeCondition.calls = { where: activityWhere.calls, orderBy: { callTime: 'desc' } };
  }

  if (!activity_type || activity_type === 'EMAIL') {
    includeCondition.emails = { where: activityWhere.emails, orderBy: { sentAt: 'desc' } };
  }

  if (!activity_type || activity_type === 'INVOICE') {
    includeCondition.invoices = { where: activityWhere.invoices, orderBy: { invoiceDate: 'desc' } };
  }

  return includeCondition;
};

// ============================================================================
// 1. GET LEAD BY ID (View Detail)
// ============================================================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const { searchParams } = new URL(req.url);

    // Bangun query include dinamis
    const includeCondition = buildLeadInclude(searchParams);

    // 1. Ambil data dengan include dinamis dan _count agregasi
    const result = await prisma.lead.findUnique({
      where: { id: id, deletedAt: null },
      include: {
        // Sertakan includeCondition yang dibangun dinamis
        ...includeCondition,
        // 🔥 Penambahan _count untuk mendapatkan jumlah aktivitas total
        _count: {
          select: {
            notes: true,
            meetings: true,
            calls: true,
            emails: true,
            invoices: true,
          },
        },
      },
    });

    const lead = result as any; // Paksa tipe ke any untuk destructuring

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Cek apakah user mem-follow lead ini (untuk UI tombol Follow)
    // @ts-ignore
    const isFollowed = lead.followers?.some((f: any) => f.id === user.id) || false;
    
    // 🔥 Destructure _count dari object lead
    const { _count, ...leadData } = lead;

    return NextResponse.json({ 
        data: { 
          ...leadData, 
          isFollowed,
          activityCounts: _count // Menyimpan hitungan ke field baru
        } 
    });

  } catch (error) {
    console.error("Error in getLeadById:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// 2. UPDATE LEAD (Edit Data / Pindah Stage)
// ============================================================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 1. Auth Check
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Cek Data Lama (untuk validasi Owner)
    const existingLead = await prisma.lead.findUnique({ 
        where: { id },
        select: { ownerId: true , stage: true }
    });

    if (!existingLead) {
        return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }
  
    // 3. RBAC: Hanya Admin atau Owner yang boleh edit
    if (user.role !== 'ADMIN' && existingLead.ownerId !== user.id) {
       return NextResponse.json({ message: "Forbidden: You don't have permission" }, { status: 403 });
    } 

    // 4. Proses Data
    const body = await req.json();

    // Simpan status lama sebelum update untuk perbandingan
    const oldStage = existingLead.stage;
    
    // Siapkan object update yang bersih
    const updateData: any = { ...body };

    // Hapus field yang dilarang diubah lewat endpoint ini
    delete updateData.id;
    delete updateData.ownerId; 
    delete updateData.createdAt;
    delete updateData.deletedAt;

    // Logika Otomatis Closed Date
    if (updateData.status) {
      if (['WON', 'LOST'].includes(updateData.status)) {
        updateData.closedAt = new Date();
      } else {
        updateData.closedAt = null; 
      }
    }

    // [OPSIONAL] Pastikan Value aman untuk Decimal (jika dikirim string/number)
    // Prisma biasanya pintar menangani ini, tapi ini untuk jaga-jaga
    if (updateData.value !== undefined) {
        updateData.value = Number(updateData.value);
    }

    // 5. Update DB & 🔥 Create Audit Log (Gunakan Transaction)
    const [updatedLead] = await prisma.$transaction([
        // A. Update Lead
        prisma.lead.update({
            where: { id },
            data: updateData,
        }),
        // B. Catat History jika Stage berubah
        ...(body.stage && body.stage !== oldStage ? [
            prisma.auditLog.create({
                data: {
                    actionType: "CHANGE_STAGE",
                    entityType: "LEAD",
                    entityId: id,
                    actorId: user.id,
                    detailsJson: { // Simpan perubahan
                        from: oldStage,
                        to: body.stage
                    }
                }
            })
        ] : [])
    ]);

    return NextResponse.json({
      message: 'Lead updated successfully',
      data: updatedLead,
    });

  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// 3. DELETE LEAD (Soft Delete)
// ============================================================================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 1. Auth Check
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Cek Data Lama
    const existingLead = await prisma.lead.findUnique({ 
        where: { id },
        select: { ownerId: true }
    });

    if (!existingLead) {
        return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    // 3. RBAC: Hanya Admin atau Owner yang boleh hapus
    if (user.role !== 'ADMIN' && existingLead.ownerId !== user.id) {
        return NextResponse.json({ message: "Forbidden: You cannot delete this lead" }, { status: 403 });
    }

    // 4. Soft Delete (Isi deletedAt)
    await prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Lead deleted successfully" });

  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}