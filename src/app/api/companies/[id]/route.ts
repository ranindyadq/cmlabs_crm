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
    const { searchParams } = new URL(req.url);
    const leadsPage = parseInt(searchParams.get("leadsPage") || "1");
    const leadsLimit = parseInt(searchParams.get("leadsLimit") || "5");
    const leadsSkip = (leadsPage - 1) * leadsLimit;

    // 2. Ambil Data Company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
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
        leads: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            stage: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip: leadsSkip,
          take: leadsLimit
        },
        _count: {
          select: {
            leads: { where: { deletedAt: null } }
          }
        }
      }
    });

    // 3. Validasi Not Found
    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    const totalLeads = company._count?.leads || 0;
    const totalPages = Math.ceil(totalLeads / leadsLimit);

    return NextResponse.json({ 
      data: company,
      pagination: {
        currentPage: leadsPage,
        totalPages,
        totalLeads,
        leadsPerPage: leadsLimit
      }
    });

  } catch (error) {
    console.error("Error fetching company detail:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}