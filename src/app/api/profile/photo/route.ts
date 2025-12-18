import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { put } from "@vercel/blob"; // 🔥 Import Vercel Blob

export async function POST(req: Request) {
  try {
    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil File dari Form Data
    const formData = await req.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json({ message: "File foto tidak ditemukan." }, { status: 400 });
    }

    // 3. Validasi Tipe File (Keamanan)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
       return NextResponse.json({ message: "Format file harus JPG, PNG, atau WEBP." }, { status: 400 });
    }

    // --- BAGIAN INI BERUBAH UNTUK VERCEL ---
    
    // Buat nama file unik
    const ext = file.name.split(".").pop();
    const filename = `user-${user.id}-${Date.now()}.${ext}`;

    // 4. Upload ke Vercel Blob (Cloud Storage)
    const blob = await put(filename, file, {
      access: 'public', // Agar bisa dilihat di frontend
    });

    // 5. Update URL di Database
    // Vercel Blob akan mengembalikan URL lengkap (https://...)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { photo: blob.url }, 
    });

    return NextResponse.json({
      message: "Foto profil berhasil diperbarui.",
      photoUrl: updatedUser.photo, // URL dari cloud
    });

  } catch (error) {
    console.error("Error upload photo:", error);
    return NextResponse.json({ message: "Gagal memperbarui foto." }, { status: 500 });
  }
}