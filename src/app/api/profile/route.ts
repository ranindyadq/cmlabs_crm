import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
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

  workInfo: z.object({
    department: z.string().optional(),
    bio: z.string().max(100, "Bio maksimal 100 karakter").optional(),
    location: z.string().max(50).optional(),
    reportsTo: z.string().optional(),
    skills: z.string().optional()
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
        workInfo: true, // Pastikan ini 'userWorkInfo' sesuai schema Prisma kamu
        role: true
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
        message: "Input tidak valid", 
        errors: validation.error.format() // Memberitahu frontend field mana yang salah
      }, { status: 400 });
    }

    const { fullName, phone, workInfo } = validation.data;

    // --- MULAI TRANSAKSI DATABASE ---
    await prisma.$transaction(async (tx) => {
      // 1. Update Data User
      await tx.user.update({
        where: { id: user.id },
        data: { 
            // Hanya update jika data ada (undefined check handled by Prisma usually, 
            // tapi hasil Zod .optional() mengembalikan undefined jika tidak ada, yang aman buat Prisma)
            fullName, 
            phone 
        }
      });

      const rawSkills = workInfo?.skills;
      
      const formattedSkills = rawSkills && typeof rawSkills === 'string' 
        ? rawSkills.split(',').map((s: string) => s.trim()) 
        : [];

      // 2. Gunakan formattedSkills di dalam query
      await tx.userWorkInfo.upsert({
        where: { userId: user.id },
        create: { 
            user: { connect: { id: user.id } }, 
            bio: workInfo?.bio, 
            location: workInfo?.location, 
            department: workInfo?.department, 
            reportsTo: workInfo?.reportsTo,   
            skills: formattedSkills
        },
        update: { 
            bio: workInfo?.bio, 
            location: workInfo?.location, 
            department: workInfo?.department, 
            reportsTo: workInfo?.reportsTo,   
            skills: formattedSkills
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
            changes: { fullName, phone, ...workInfo } // Data bersih yang dicatat
          }
        }
      });
    });

    return NextResponse.json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}