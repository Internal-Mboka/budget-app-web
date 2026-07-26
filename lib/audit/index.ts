import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
