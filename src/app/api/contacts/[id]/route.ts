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
    const { searchParams } = new URL(req.url);
    const leadsPage = parseInt(searchParams.get("leadsPage") || "1");
    const leadsLimit = parseInt(searchParams.get("leadsLimit") || "5");
    const leadsSkip = (leadsPage - 1) * leadsLimit;

    // 2. Ambil Data Contact dari Database
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        company: {
          select: { name: true, id: true }
        },
        // Include leads dengan pagination
        leads: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            stage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: leadsSkip,
          take: leadsLimit,
        },
        _count: {
          select: {
            leads: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    // 3. Validasi jika tidak ditemukan
    if (!contact) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    // 4. Return Data dengan pagination info
    const totalLeads = contact._count?.leads || 0;
    const totalPages = Math.ceil(totalLeads / leadsLimit);
    
    return NextResponse.json({ 
      data: contact,
      pagination: {
        currentPage: leadsPage,
        totalPages,
        totalLeads,
        leadsPerPage: leadsLimit
      }
    });

  } catch (error) {
    console.error("Error fetching contact detail:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}