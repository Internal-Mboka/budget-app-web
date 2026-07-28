import type { ActiveSessionRow } from "@/lib/sessions/service";

export type UserDeviceGroup = {
  fingerprint: string;
  browser: string;
  deviceType: string;
  ipAddress: string;
  sessionCount: number;
  sessionIds: string[];
  /** ISO 8601 — sérialisable Server → Client */
  lastActiveAt: string;
  isCurrentDevice: boolean;
};

function encodeFingerprintPart(value: string): string {
  return encodeURIComponent(value);
}

function decodeFingerprintPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildDeviceFingerprint(
  session: Pick<ActiveSessionRow, "browser" | "deviceType" | "ipAddress">
): string {
  return [session.browser, session.deviceType, session.ipAddress]
    .map(encodeFingerprintPart)
    .join("|");
}

export function parseDeviceFingerprint(fingerprint: string): {
  browser: string;
  deviceType: string;
  ipAddress: string;
} {
  const parts = fingerprint.split("|").map(decodeFingerprintPart);

  const [browser = "Navigateur inconnu", deviceType = "Inconnu", ipAddress = "Inconnue"] = parts;

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

      if (session.lastActiveAt > new Date(existing.lastActiveAt)) {
        existing.lastActiveAt = session.lastActiveAt.toISOString();
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
      lastActiveAt: session.lastActiveAt.toISOString(),
      isCurrentDevice: session.id === currentSessionId,
    });
  }

  return Array.from(groups.values()).sort(
    (left, right) => new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime()
  );
}
