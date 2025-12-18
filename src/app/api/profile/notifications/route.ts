import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id }
  });
  
  // Return default jika belum ada
  return NextResponse.json({ data: prefs || { emailDealUpdates: true, emailActivityReminders: true } });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json(); // { emailDealUpdates: boolean, ... }

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body },
    update: { ...body }
  });

  return NextResponse.json({ message: "Preferences updated" });
}