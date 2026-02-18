import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// ============================================================================
// HELPER: Build Dynamic Include
// ============================================================================
const buildLeadInclude = (searchParams: URLSearchParams) => {
  const activity_search = searchParams.get('activity_search');
  const activity_type = searchParams.get('activity_type');

  const searchCondition = activity_search
    ? { contains: activity_search, mode: 'insensitive' as const }
    : undefined;

  // Hapus 'activities' dari sini
  const activityWhere: any = {
    notes: searchCondition ? { content: searchCondition } : undefined,
    meetings: searchCondition ? { title: searchCondition } : undefined,
    calls: searchCondition ? { notes: searchCondition } : undefined,
    emails: searchCondition ? { OR: [{ subject: searchCondition }, { body: searchCondition }] } : undefined,
    invoices: searchCondition ? { invoiceNumber: searchCondition } : undefined,
  };

  const includeCondition: any = {
    owner: { select: { fullName: true, email: true } },
    contact: true,
    company: true,
    labels: { include: { label: true } },
    followers: { select: { id: true, fullName: true } },
    customFieldValues: { include: { field: true } },
    // JANGAN tambahkan include activities di sini
  };

  const LIMIT_TIMELINE = 20;

  // Logika Filter Jenis Aktivitas (Hanya include jika type sesuai atau kosong)
  if (!activity_type || activity_type === 'NOTE') {
    includeCondition.notes = { where: activityWhere.notes, orderBy: { createdAt: 'desc' }, take: LIMIT_TIMELINE };
  }

  if (!activity_type || activity_type === 'MEETING') {
    includeCondition.meetings = {
      where: activityWhere.meetings,
      orderBy: { startTime: 'desc' },
      take: LIMIT_TIMELINE,
      include: {
        organizer: { select: { id: true, fullName: true } },
        attendees: { select: { user: { select: { id: true, fullName: true } } } }
      }
    };
  }

  if (!activity_type || activity_type === 'CALL') {
    includeCondition.calls = { where: activityWhere.calls, orderBy: { callTime: 'desc' }, take: LIMIT_TIMELINE, };
  }

  if (!activity_type || activity_type === 'EMAIL') {
    includeCondition.emails = { where: activityWhere.emails, orderBy: { sentAt: 'desc' }, take: LIMIT_TIMELINE };
  }

  if (!activity_type || activity_type === 'INVOICE') {
    includeCondition.invoices = { 
      where: activityWhere.invoices, 
      // GANTI createdAt menjadi invoiceDate
      orderBy: { invoiceDate: 'desc' },
      take: LIMIT_TIMELINE,
    };
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
    const includeCondition = buildLeadInclude(searchParams);

    const lead = await prisma.lead.findUnique({
      where: { id: id, deletedAt: null },
      include: {
        ...includeCondition,
        _count: {
          select: {
            notes: true,
            meetings: true,
            calls: true,
            emails: true,
            invoices: true,
            // Hapus activities: true di sini
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Cek apakah user memfollow lead ini
    // @ts-ignore: followers ada di includeCondition base
    const isFollowed = lead.followers?.some((f: any) => f.id === user.id) || false;

    // Pisahkan _count agar respons lebih rapi
    const { _count, ...leadData } = lead;

    return NextResponse.json({
      data: {
        ...leadData,
        value: leadData.value ? Number(leadData.value) : 0,
        isFollowed,
        activityCounts: _count
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

    // 2. Cek Data Lama
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { ownerId: true, stage: true, contactId: true }
    });

    if (!existingLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    // 3. RBAC (Admin atau Owner)
    if (user.role !== 'ADMIN' && existingLead.ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden: You don't have permission" }, { status: 403 });
    }

    // 4. Proses Body Request
    const body = await req.json();
    const updateData: any = { ...body };

    // Sanitasi field yang dilarang diubah manual
    delete updateData.id;
    delete updateData.ownerId;
    delete updateData.createdAt;
    delete updateData.deletedAt;

    // Mapping & Clean up
    if (body.client_type) {
      updateData.clientType = body.client_type;
      delete updateData.client_type;
    }
    if (!body.priority) delete updateData.priority;

    // --- LOGIKA RELASI UTAMA (Disimpan di updateData untuk update Lead) ---

    // A. Company
    if (body.company_name) {
      updateData.company = {
        connectOrCreate: {
          where: { name: body.company_name },
          create: { name: body.company_name },
        },
      };
    } else if (body.company_name === "") {
      updateData.company = { disconnect: true };
    }
    delete updateData.company_name;

    // B. Contact Name (Link Orang)
    if (body.contact_name) {
      const existingContact = await prisma.contact.findFirst({
        where: { name: body.contact_name },
      });
      if (existingContact) {
        updateData.contact = { connect: { id: existingContact.id } };
      } else {
        updateData.contact = { create: { name: body.contact_name } };
      }
    } else if (body.contact_name === "") {
      updateData.contact = { disconnect: true };
    }
    delete updateData.contact_name;

    // C. Ambil data detail kontak (Phone/Email) tapi hapus dari updateData Lead
    const contactPhone = body.contact_phone;
    const contactEmail = body.contact_email;
    delete updateData.contact_phone;
    delete updateData.contact_email;

    // D. Labels (Hapus dari updateData karena akan diproses terpisah di transaction)
    const labels = body.labels;
    delete updateData.labels;

    // E. Otomatisasi Closed Date
    if (updateData.status) {
      updateData.closedAt = ['WON', 'LOST'].includes(updateData.status) ? new Date() : null;
    }
    if (updateData.value !== undefined) {
      updateData.value = Number(updateData.value);
    }

    // --- PERSIAPAN TRANSAKSI ---
    const transactionOperations: any[] = [];

    // 1. Operation: Update Lead Utama
    transactionOperations.push(
      prisma.lead.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
          contact: true,
          labels: { include: { label: true } }
        }
      })
    );

    // 2. Operation: Update Detail Kontak (Phone/Email)
    // PENTING: Hanya update jika user TIDAK mengganti kontak (contact_name kosong)
    // Jika user mengganti contact_name, kita tidak tahu ID kontak baru sampai transaction selesai, 
    // jadi hindari update detail kontak lama dengan data kontak baru.
    if (!body.contact_name && existingLead.contactId && (contactPhone !== undefined || contactEmail !== undefined)) {
      transactionOperations.push(
        prisma.contact.update({
          where: { id: existingLead.contactId },
          data: { phone: contactPhone, email: contactEmail }
        })
      );
    }

    // 3. Operation: Labels (Delete All & Re-create)
    if (labels && Array.isArray(labels)) {
      // Hapus label lama
      transactionOperations.push(
        prisma.leadLabel.deleteMany({ where: { leadId: id } })
      );

      // Pasang label baru
      for (const labelName of labels) {
        const cleanName = labelName.trim();
        if (cleanName) {
          transactionOperations.push(
            prisma.leadLabel.create({
              data: {
                lead: { connect: { id } },
                label: {
                  connectOrCreate: {
                    where: { name: cleanName },
                    create: { name: cleanName, colorHex: "#6366f1" }
                  }
                }
              }
            })
          );
        }
      }
    }

    // 4. Operation: Audit Log (Jika Pindah Stage)
    if (body.stage && body.stage !== existingLead.stage) {
      transactionOperations.push(
        prisma.auditLog.create({
          data: {
            actionType: "CHANGE_STAGE",
            entityType: "LEAD",
            entityId: id,
            actorId: user.id,
            detailsJson: { from: existingLead.stage, to: body.stage }
          }
        })
      );
    }

    // 5. EKSEKUSI TRANSAKSI
    const results = await prisma.$transaction(transactionOperations);

    // Hasil pertama selalu Lead yang sudah diupdate
    const updatedLead = results[0];

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
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!existingLead) return NextResponse.json({ message: "Lead not found" }, { status: 404 });

    if (user.role !== 'ADMIN' && existingLead.ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

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