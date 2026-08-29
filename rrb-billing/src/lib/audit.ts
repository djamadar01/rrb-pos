import { prisma } from "./prisma";

export async function logAuditAction({
  userId,
  role,
  action,
  targetType,
  targetId,
  details,
  ipAddress = "127.0.0.1",
}: {
  userId: string;
  role: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId,
      role,
      action,
      targetType,
      targetId,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ipAddress,
    },
  });
}
