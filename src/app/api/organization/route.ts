import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

// GET: Ambil Data Profile
export async function GET(req: Request) {
  try {
    // 🔒 OPSI KEAMANAN TAMBAHAN: Cek login dulu
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.organizationProfile.findFirst();
    
    // Default value jika kosong
    if (!profile) {
      return NextResponse.json({ 
        data: {
          companyName: "",
          tagline: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          province: "",
          country: "",
          email: "",
          phone: "",
          website: "",
        } 
      });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("Error fetching org profile:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

// POST: Simpan/Update Data
export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    // Pastikan hanya ADMIN yang bisa ubah (Opsional)
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden: Access Denied" }, { status: 403 });
    }

    const body = await req.json();
    
    // Destructuring sesuai model Anda
    const { 
      companyName, 
      tagline,
      addressLine1, 
      addressLine2, 
      city, 
      province, 
      country, 
      email, 
      phone, 
      website,
      logoUrl,
    } = body;

    // Cek apakah data sudah ada
    const existing = await prisma.organizationProfile.findFirst();

    let result;
    if (existing) {
      // Update
      result = await prisma.organizationProfile.update({
        where: { id: existing.id },
        data: {
          companyName,
          tagline,
          addressLine1,
          addressLine2,
          city,
          province,
          country,
          email,
          phone,
          website,
          logoUrl
        },
      });
    } else {
      // Create Baru
      result = await prisma.organizationProfile.create({
        data: {
          companyName: companyName || "My Company",
          tagline,
          addressLine1,
          addressLine2,
          city,
          province,
          country,
          email,
          phone,
          website,
          logoUrl
        },
      });
    }

    return NextResponse.json({ message: "Profile saved", data: result });

  } catch (error) {
    console.error("Error saving org profile:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}