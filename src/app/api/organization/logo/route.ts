import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob"; 

export async function POST(req: Request) {
  try {
    // 1. Cek User & Role (Security)
    const user = await getSessionUser(req);
    // Pastikan user ada & role ADMIN
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Ambil File dari Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ message: "File required" }, { status: 400 });
    }

    // Buat nama file unik
    const sanitizedName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `org-logo-${Date.now()}-${sanitizedName}`;
    
    let logoUrl = "";

    // ==========================================
    // SKENARIO 1: JIKA VERCEL BLOB (Production)
    // ==========================================
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(filename, file, { access: 'public' });
        logoUrl = blob.url;
    } 
    // ==========================================
    // SKENARIO 2: JIKA LOCALHOST (Local Disk)
    // ==========================================
    else {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Simpan di folder public/uploads
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        
        logoUrl = `/uploads/${filename}`;
    }

    // 3. Update Database (Logic Singleton)
    // Cari data organisasi yang pertama kali ditemukan
    const existingOrg = await prisma.organizationProfile.findFirst();

    if (existingOrg) {
        // JIKA ADA: Update data tersebut
        await prisma.organizationProfile.update({
            where: { id: existingOrg.id },
            data: { logoUrl: logoUrl }
        });
    } else {
        // JIKA BELUM ADA: Buat baru
        await prisma.organizationProfile.create({
            data: {
                companyName: "My Company", // Default Name wajib diisi karena schema tidak nullable
                logoUrl: logoUrl
            }
        });
    }

    return NextResponse.json({ 
        message: "Logo uploaded successfully", 
        photoUrl: logoUrl 
    });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ 
        message: "Internal Server Error", 
        error: error.message 
    }, { status: 500 });
  }
}