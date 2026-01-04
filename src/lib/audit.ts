import { prisma } from "@/lib/prisma";

export async function logAudit(actorId: string | null, targetId: string | null, actionType: string, details: any) {
  try {
    await prisma.auditLog.create({
      data: { actorId, targetId, actionType, detailsJson: details || {} },
    });
  } catch (err) { console.error(`Audit Log Failed:`, err); }
}