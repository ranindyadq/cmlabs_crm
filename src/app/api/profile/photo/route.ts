import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob"; // Import Vercel Blob

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ message: "File required" }, { status: 400 });

    // Validasi Tipe & Ukuran (Sama seperti sebelumnya)
    // ... (Kode validasi size/type tetap sama) ...

    let fileUrl = "";

    // === LOGIKA PEMISAH (SWITCH) ===
    // Cek apakah kita sedang di Vercel (Production) atau Local
    if (process.env.NODE_ENV === "production" || process.env.BLOB_READ_WRITE_TOKEN) {
      
      // --- CARA 1: UPLOAD KE VERCEL BLOB (CLOUD) ---
      console.log("Uploading to Vercel Blob...");
      const filename = `avatar-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const blob = await put(filename, file, {
        access: 'public',
      });
      
      fileUrl = blob.url; // URL dari cloud (https://...)

    } else {
      
      // --- CARA 2: UPLOAD KE LOCAL FOLDER (LAPTOP) ---
      console.log("Uploading to Local Folder...");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `avatar-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      
      fileUrl = `/uploads/${fileName}`;
    }

    // Update Database
    await prisma.user.update({
      where: { id: user.id },
      data: { photo: fileUrl },
    });

    return NextResponse.json({
      message: "Success",
      data: { url: fileUrl },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error uploading" }, { status: 500 });
  }
}