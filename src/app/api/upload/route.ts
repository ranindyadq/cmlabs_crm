import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { getSessionUser } from "@/lib/auth-helper";

// Konfigurasi Upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

export async function POST(req: Request) {
  try {
    // 1. Auth Check - Hanya user yang login bisa upload
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    // 2. Validasi Tipe File
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipe file tidak diizinkan. Hanya gambar (JPG, PNG, GIF, WebP), PDF, dan dokumen Office yang diperbolehkan." 
      }, { status: 400 });
    }

    // 3. Validasi Ukuran File
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      }, { status: 400 });
    }

    // 4. Convert file ke Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Buat nama file unik (ganti spasi dengan underscore + timestamp)
    // Sanitize filename untuk keamanan
    const safeFilename = file.name.replaceAll(" ", "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const filename = Date.now() + "_" + safeFilename;
    
    // 6. Tentukan lokasi simpan (Folder public/uploads)
    const uploadDir = path.join(process.cwd(), "public/uploads", filename);

    // 7. Tulis file ke disk
    await writeFile(uploadDir, buffer);

    // 8. Kembalikan URL File (Relative Path)
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
        message: "Upload success", 
        url: fileUrl 
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}