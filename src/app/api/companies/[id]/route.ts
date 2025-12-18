import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Cek User Login
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const companyId = params.id;

    // 2. Ambil Data Company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      // ✅ RELASI: Mengambil daftar kontak yang terhubung dengan perusahaan ini
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            phone: true
          }
        },
        // (Opsional) Jika ingin melihat Leads yang terkait dengan perusahaan ini
        leads: {
          select: {
            id: true,
            title: true,
            value: true,
            status: true
          }
        }
      }
    });

    // 3. Validasi Not Found
    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ data: company });

  } catch (error) {
    console.error("Error fetching company detail:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}