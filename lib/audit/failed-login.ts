import { prisma } from "@/lib/prisma";

import { writeAuditLog } from "./index";
import { readAuditRequestMeta } from "./request-context";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const FAILURE_ALERT_THRESHOLD = 3;

export async function recordFailedLoginAttempt(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!user) {
    return;
  }

  const meta = await readAuditRequestMeta();
  const windowStart = new Date(Date.now() - FAILURE_WINDOW_MS);

  await writeAuditLog({
    action: "LOGIN_FAILED",
    entity: "User",
    entityId: user.id,
    userId: user.id,
    details: {
      email: user.email,
      reason: "invalid_credentials",
      deviceType: meta.deviceType,
      browser: meta.browser,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  const recentFailures = await prisma.auditLog.count({
    where: {
      userId: user.id,
      action: "LOGIN_FAILED",
      createdAt: { gte: windowStart },
    },
  });

  if (recentFailures < FAILURE_ALERT_THRESHOLD) {
    return;
  }

  const existingAlert = await prisma.auditLog.findFirst({
    where: {
      userId: user.id,
      action: "SECURITY_ALERT",
      createdAt: { gte: windowStart },
    },
    select: { id: true },
  });

  if (existingAlert) {
    return;
  }

  await writeAuditLog({
    action: "SECURITY_ALERT",
    entity: "User",
    entityId: user.id,
    userId: user.id,
    details: {
      type: "brute_force_login",
      failedAttempts: recentFailures,
      email: user.email,
      message: `${recentFailures} échecs de connexion consécutifs détectés.`,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });
}
