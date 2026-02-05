import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    // 1. Cek Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil File dari Form Data
    const formData = await req.formData();
    // PENTING: Kita sepakati key-nya adalah "file" (sesuai frontend sebelumnya)
    const file = formData.get("file") as File; 

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan." }, { status: 400 });
    }

    // 3. Validasi Tipe File
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
       return NextResponse.json({ message: "Format file harus JPG/PNG." }, { status: 400 });
    }

    // 4. Validasi Ukuran (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: "File terlalu besar (Max 2MB)" }, { status: 400 });
    }

    // 5. Persiapkan Folder Upload (Localhost)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
    
    // Pastikan folder public/uploads ada
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true }); // Buat folder jika belum ada

    const filePath = path.join(uploadDir, fileName);
    
    // 6. Tulis File ke Folder
    await writeFile(filePath, buffer);

    // 7. Simpan URL ke Database
    // URL publik adalah /uploads/namafile
    const fileUrl = `/uploads/${fileName}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { photo: fileUrl },
    });

    return NextResponse.json({
      message: "Foto berhasil diupload",
      data: { url: fileUrl }, // Return URL agar frontend bisa langsung update state
    });

  } catch (error) {
    console.error("Error upload photo:", error);
    return NextResponse.json({ message: "Gagal memperbarui foto." }, { status: 500 });
  }
}