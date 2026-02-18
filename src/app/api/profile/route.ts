import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, sanitizeUser } from "@/lib/auth-helper";
import { z } from "zod";

// ==========================================
// 1. DEFINISI SCHEMA VALIDASI (ZOD)
// ==========================================
const updateProfileSchema = z.object({
  // .optional() artinya field ini boleh tidak dikirim
  // tapi JIKA dikirim, harus mengikuti aturan mainnya.
  
  fullName: z.string().min(3, "Nama minimal 3 karakter").optional(),
  
  phone: z.string()
    .regex(/^[\d+]+$/, "Nomor telepon hanya boleh angka dan +")
    .min(10, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")), // Boleh kosong string ""

  managerId: z.string().optional().nullable(), // Bisa UUID, "", atau null

  workInfo: z.object({
    department: z.string().optional(),
    bio: z.string().max(100, "Bio maksimal 100 karakter").optional(),
    location: z.string().max(50).optional(),
    skills: z.array(z.string()).optional(),
    // Handle Date (Frontend mengirim string ISO atau Date object)
    joinedAt: z.coerce.date().optional().nullable(),
    }).optional()
  // Frontend mengirim string (misal: "React, Vue"), kita validasi string
});

// ==========================================
// 2. LOGIC ENDPOINT
// ==========================================
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        // Ambil data detail pekerjaan
        workInfo: true, 
        // Ambil data Role
        role: true,
        // Ambil data Manager (Hanya Nama & ID untuk dropdown frontend)
        manager: {
            select: {
                id: true,
                fullName: true
            }
        }
      },
    });

    if (!userData) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ data: userData });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // --- VALIDASI ZOD DI SINI ---
    const validation = updateProfileSchema.safeParse(body);

    // Jika validasi gagal, kembalikan error 400 beserta detailnya
    if (!validation.success) {
      return NextResponse.json({ 
        message: "Invalid input", 
        errors: validation.error.format() // Memberitahu frontend field mana yang salah
      }, { status: 400 });
    }

    const { fullName, phone, managerId, workInfo } = validation.data;

    const finalManagerId = managerId === "" ? null : managerId;

    let updatedUser;

    // --- MULAI TRANSAKSI DATABASE ---
    await prisma.$transaction(async (tx) => {
      // 1. Update Data User
      await tx.user.update({
        where: { id: user.id },
        data: { 
            // Hanya update jika data ada (undefined check handled by Prisma usually, 
            // tapi hasil Zod .optional() mengembalikan undefined jika tidak ada, yang aman buat Prisma)
            fullName, 
            phone,
            managerId: finalManagerId
        },
        include: { role: true, workInfo: true }
      });

      // 2. Gunakan formattedSkills di dalam query
      await tx.userWorkInfo.upsert({
        where: { userId: user.id },
        create: { 
            userId: user.id, // Relasi wajib saat create
            bio: workInfo?.bio, 
            location: workInfo?.location, 
            department: workInfo?.department, 
            skills: workInfo?.skills || [], // Simpan array langsung (PostgreSQL mendukung String[])
            joinedAt: workInfo?.joinedAt
        },
        update: { 
            bio: workInfo?.bio, 
            location: workInfo?.location, 
            department: workInfo?.department, 
            skills: workInfo?.skills, // Simpan array langsung
            joinedAt: workInfo?.joinedAt
        }
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actionType: "UPDATE_PROFILE",
          entityType: "User",
          entityId: user.id,
          actorId: user.id,
          detailsJson: {
            changes: { 
                fullName, 
                phone, 
                managerId: finalManagerId,
                ...workInfo 
            }
          }
        }
      });
    });

    return NextResponse.json({ 
      message: "Profile updated successfully",
      data: sanitizeUser(updatedUser)
    });

  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}