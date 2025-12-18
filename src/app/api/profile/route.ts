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
    
  bio: z.string().max(100, "Bio maksimal 100 karakter").optional(),
  
  location: z.string().max(50).optional(),
  
  // Frontend mengirim string (misal: "React, Vue"), kita validasi string
  skills: z.string().optional(),
});

// ==========================================
// 2. LOGIC ENDPOINT
// ==========================================

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

    // Ambil data yang SUDAH BERSIH dan TERVALIDASI
    // Zod otomatis membuang field 'sampah' (seperti role/email) jika tidak ada di schema
    const { fullName, phone, bio, location, skills } = validation.data;

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

      // 2. Update Work Info
      await tx.userWorkInfo.upsert({
        where: { userId: user.id },
        create: { user: { connect: { id: user.id } }, bio, location, skills },
        update: { bio, location, skills }
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actionType: "UPDATE_PROFILE",
          entityType: "User",
          entityId: user.id,
          actorId: user.id,
          detailsJson: {
            changes: { fullName, phone, bio, location } // Data bersih yang dicatat
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