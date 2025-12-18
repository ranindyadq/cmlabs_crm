import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const picId = searchParams.get('picId');
    
    const whereOwner = picId ? { ownerId: picId } : {}; 
    const whereOrganizer = picId ? { organizerId: picId } : {}; 
    const now = new Date();

    const [recentDeals, meetings, calls, emails, invoices] = await prisma.$transaction([
      // 1. Recent Deals (Status WON)
      prisma.lead.findMany({
        where: { deletedAt: null, status: 'WON', ...whereOwner },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { owner: { select: { fullName: true } } }
      }),

      // 2. Upcoming Meetings
      prisma.meeting.findMany({
        where: { startTime: { gte: now }, ...whereOrganizer },
        orderBy: { startTime: 'asc' },
        take: 5,
        include: {
          lead: { select: { title: true, contact: { select: { name: true } } } },
          organizer: { select: { fullName: true } }
        }
      }),

      // 3. Upcoming Calls
      prisma.call.findMany({
        where: { callTime: { gte: now }, ...(picId ? { userId: picId } : {}) },
        orderBy: { callTime: 'asc' },
        take: 5,
        include: {
          lead: { select: { title: true, contact: { select: { name: true } } } }
        }
      }),

      // 4. Scheduled Emails
      prisma.email.findMany({
        where: { scheduledAt: { gte: now }, ...(picId ? { userId: picId } : {}) },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: {
          lead: { select: { title: true } }
        }
      }),

      // 5. Unpaid Invoices (Upcoming Due Date)
      prisma.invoice.findMany({
        where: { dueDate: { gte: now }, status: { not: 'PAID' }, ...whereOwner },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          lead: { select: { title: true } }
        }
      })
    ]);

    return NextResponse.json({
      data: {
        recentDeals,
        upcomingActivities: {
          meetings,
          calls,
          emails,
          invoices
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}