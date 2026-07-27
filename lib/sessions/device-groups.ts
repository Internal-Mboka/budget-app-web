import type { ActiveSessionRow } from "@/lib/sessions/service";

export type UserDeviceGroup = {
  fingerprint: string;
  browser: string;
  deviceType: string;
  ipAddress: string;
  sessionCount: number;
  sessionIds: string[];
  lastActiveAt: Date;
  isCurrentDevice: boolean;
};

export function buildDeviceFingerprint(
  session: Pick<ActiveSessionRow, "browser" | "deviceType" | "ipAddress">
): string {
  return [session.browser, session.deviceType, session.ipAddress].join("::");
}

export function parseDeviceFingerprint(fingerprint: string): {
  browser: string;
  deviceType: string;
  ipAddress: string;
} {
  const [browser = "Navigateur inconnu", deviceType = "Inconnu", ipAddress = "Inconnue"] =
    fingerprint.split("::");

  return { browser, deviceType, ipAddress };
}

export function groupSessionsByDevice(
  sessions: ActiveSessionRow[],
  currentSessionId?: string
): UserDeviceGroup[] {
  const groups = new Map<string, UserDeviceGroup>();

  for (const session of sessions) {
    const fingerprint = buildDeviceFingerprint(session);
    const existing = groups.get(fingerprint);

    if (existing) {
      existing.sessionIds.push(session.id);
      existing.sessionCount += 1;

      if (session.lastActiveAt > existing.lastActiveAt) {
        existing.lastActiveAt = session.lastActiveAt;
      }

      if (session.id === currentSessionId) {
        existing.isCurrentDevice = true;
      }

      continue;
    }

    groups.set(fingerprint, {
      fingerprint,
      browser: session.browser,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      sessionCount: 1,
      sessionIds: [session.id],
      lastActiveAt: session.lastActiveAt,
      isCurrentDevice: session.id === currentSessionId,
    });
  }

  return Array.from(groups.values()).sort(
    (left, right) => right.lastActiveAt.getTime() - left.lastActiveAt.getTime()
  );
}
