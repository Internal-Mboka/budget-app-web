import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

import type { SessionClientMeta } from "./user-agent";

const ACTIVE_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const SESSION_REUSE_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Limite douce OWASP-inspired — au-delà, les sessions les plus anciennes sont retirées. */
export const MAX_ACTIVE_SESSIONS_PER_USER = 10;

export type ActiveSessionRow = {
  id: string;
  deviceType: string;
  browser: string;
  ipAddress: string;
  lastActiveAt: Date;
  createdAt: Date;
};

export async function createUserSession(userId: string, meta: SessionClientMeta) {
  return prisma.session.create({
    data: {
      userId,
      token: randomUUID(),
      deviceType: meta.deviceType,
      browser: meta.browser,
      ipAddress: meta.ipAddress,
    },
  });
}

export async function findReusableUserSession(userId: string, meta: SessionClientMeta) {
  const reuseSince = new Date(Date.now() - SESSION_REUSE_WINDOW_MS);

  return prisma.session.findFirst({
    where: {
      userId,
      browser: meta.browser,
      deviceType: meta.deviceType,
      ipAddress: meta.ipAddress,
      lastActiveAt: { gte: reuseSince },
    },
    orderBy: { lastActiveAt: "desc" },
  });
}

export async function findOrCreateUserSession(userId: string, meta: SessionClientMeta) {
  const reusable = await findReusableUserSession(userId, meta);

  if (reusable) {
    await touchUserSession(reusable.id);
    return reusable;
  }

  return createUserSession(userId, meta);
}

export async function pruneStaleUserSessions(userId: string, keepSessionId?: string) {
  const staleBefore = new Date(Date.now() - STALE_SESSION_MAX_AGE_MS);

  return prisma.session.deleteMany({
    where: {
      userId,
      lastActiveAt: { lt: staleBefore },
      ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
    },
  });
}

export async function isUserSessionActive(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  return Boolean(session);
}

export async function touchUserSession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
}

export function shouldTouchSession(lastActiveBump: number | undefined) {
  if (!lastActiveBump) {
    return true;
  }

  return Date.now() - lastActiveBump >= ACTIVE_TOUCH_INTERVAL_MS;
}

export async function listUserSessions(userId: string): Promise<ActiveSessionRow[]> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: [{ lastActiveAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      deviceType: true,
      browser: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    deviceType: session.deviceType ?? "Inconnu",
    browser: session.browser ?? "Navigateur inconnu",
    ipAddress: session.ipAddress ?? "Inconnue",
    lastActiveAt: session.lastActiveAt,
    createdAt: session.createdAt,
  }));
}

export async function revokeUserSession(sessionId: string, userId: string) {
  return prisma.session.deleteMany({
    where: { id: sessionId, userId },
  });
}

export async function revokeOtherUserSessions(userId: string, currentSessionId: string) {
  return prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  });
}

export async function countUserSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId } });
}

export async function enforceSessionLimit(userId: string, keepSessionId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: [{ lastActiveAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  if (sessions.length <= MAX_ACTIVE_SESSIONS_PER_USER) {
    return { deleted: 0, limited: false };
  }

  const keepIds = new Set<string>([keepSessionId]);

  for (const session of sessions) {
    if (keepIds.size >= MAX_ACTIVE_SESSIONS_PER_USER) {
      break;
    }

    keepIds.add(session.id);
  }

  const result = await prisma.session.deleteMany({
    where: {
      userId,
      id: { notIn: Array.from(keepIds) },
    },
  });

  return { deleted: result.count, limited: result.count > 0 };
}

export async function revokeUserDeviceSessions(
  userId: string,
  device: { browser: string; deviceType: string; ipAddress: string },
  keepSessionId?: string
) {
  return prisma.session.deleteMany({
    where: {
      userId,
      browser: device.browser,
      deviceType: device.deviceType,
      ipAddress: device.ipAddress,
      ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
    },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}
