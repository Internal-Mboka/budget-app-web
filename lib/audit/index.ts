import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isStealthRole } from "@/lib/stealth";

import { readAuditRequestMeta, type AuditRequestMeta } from "./request-context";

export type { AuditRequestMeta };

/**
 * US-45 — Les journaux d'audit sont append-only.
 * Aucune route API ni Server Action ne doit appeler update/delete sur AuditLog.
 */
export const AUDIT_LOG_IMMUTABLE = true as const;

export type WriteAuditLogInput = {
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  /** Contexte HTTP capturé en amont (recommandé dans les transactions). */
  requestMeta?: AuditRequestMeta | null;
  captureRequest?: boolean;
  tx?: Prisma.TransactionClient;
};

export async function captureAuditRequestContext(): Promise<AuditRequestMeta | null> {
  try {
    return await readAuditRequestMeta();
  } catch {
    return null;
  }
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  const client = input.tx ?? prisma;

  const actor = await client.user.findUnique({
    where: { id: input.userId },
    select: { role: { select: { name: true } } },
  });

  if (isStealthRole(actor?.role.name)) {
    return null;
  }

  let ipAddress = input.ipAddress;
  let userAgent = input.userAgent;

  if (input.requestMeta) {
    ipAddress = input.requestMeta.ipAddress;
    userAgent = input.requestMeta.userAgent;
  } else if (input.captureRequest !== false && !ipAddress && !userAgent) {
    try {
      const meta = await readAuditRequestMeta();
      ipAddress = meta.ipAddress;
      userAgent = meta.userAgent;
    } catch {
      // headers() indisponible (ex. callback auth hors requête)
    }
  }

  return client.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId,
      details: input.details,
      ipAddress,
      userAgent,
    },
  });
}

/** @deprecated Préférer writeAuditLog — alias conservé pour compatibilité. */
export async function createAuditLog(input: Omit<WriteAuditLogInput, "tx" | "captureRequest">) {
  return writeAuditLog(input);
}

export type AuditChangeDetails<T extends Record<string, unknown>> = {
  before: T;
  after: T;
  performedBy?: string;
};

export function buildAuditChangeDetails<T extends Record<string, unknown>>(
  before: T,
  after: T,
  performedBy?: string
): AuditChangeDetails<T> & { performedBy?: string } {
  return performedBy ? { before, after, performedBy } : { before, after };
}
