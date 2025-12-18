import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Cek User Login (Keamanan Standard)
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.id;

    // 2. Ambil Data Contact dari Database
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        company: {
          select: { name: true, id: true } // Ambil info perusahaan terkait
        },
        // Opsional: Jika ingin melihat history leads/calls orang ini
        // leads: { select: { title: true, status: true } },
      }
    });

    // 3. Validasi jika tidak ditemukan
    if (!contact) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    // 4. Return Data
    return NextResponse.json({ data: contact });

  } catch (error) {
    console.error("Error fetching contact detail:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}