import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

import type { SessionClientMeta } from "./user-agent";

const ACTIVE_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

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

export async function revokeAllUserSessions(userId: string) {
  return prisma.session.deleteMany({
    where: { userId },
  });
}
