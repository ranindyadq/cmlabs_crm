import { prisma } from "@/lib/prisma";
import TeamDetail from "../TeamDetail";
import { notFound } from "next/navigation";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      workInfo: true,
      role: true,
    },
  });

  if (!user) return notFound();

  // Mapping data DB ke format props TeamDetail
  const memberData = {
    id: user.id,
    name: user.fullName,
    role: user.workInfo?.roleTitle || "Staff",
    dept: user.workInfo?.department || "General",
    status: user.status.toLowerCase(),
    email: user.email,
    joined: user.workInfo?.joinedAt ? new Date(user.workInfo.joinedAt).toLocaleDateString() : "-",
    bio: user.workInfo?.bio || "No bio available.",
    skills: user.workInfo?.skills || [],
    phone: user.phone || "-",
    location: user.workInfo?.location || "-",
  };

  return <TeamDetail member={memberData} />;
}