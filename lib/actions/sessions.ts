"use server";

import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { auth, signOut } from "@/lib/auth/instance";
import { requireSession } from "@/lib/auth/session";
import {
  revokeOtherUserSessions,
  revokeUserDeviceSessions,
  revokeUserSession,
} from "@/lib/sessions/service";
import { parseDeviceFingerprint } from "@/lib/sessions/device-groups";
import { revokeDeviceSchema, revokeSessionSchema } from "@/lib/validations/session";

export type SessionActionResult = { success: true } | { success: false; error: string };

export async function revokeSessionAction(formData: FormData): Promise<SessionActionResult> {
  const session = await requireSession();

  const parsed = revokeSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Session invalide." };
  }

  const { sessionId } = parsed.data;
  const currentSessionId = session.user.sessionId;

  if (!currentSessionId) {
    return { success: false, error: "Session actuelle introuvable." };
  }

  const result = await revokeUserSession(sessionId, session.user.id);

  if (result.count === 0) {
    return { success: false, error: "Session introuvable ou déjà révoquée." };
  }

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "SESSION_REVOKED",
    entity: "Session",
    entityId: sessionId,
    userId: session.user.id,
    details: {
      revokedSessionId: sessionId,
      isCurrentSession: sessionId === currentSessionId,
      performedBy: session.user.email,
    },
  });

  revalidatePath("/account/sessions");

  if (sessionId === currentSessionId) {
    await signOut({ redirectTo: "/login" });
  }

  return { success: true };
}

export async function revokeOtherSessionsAction(): Promise<SessionActionResult> {
  const session = await requireSession();
  const currentSessionId = session.user.sessionId;

  if (!currentSessionId) {
    return { success: false, error: "Session actuelle introuvable." };
  }

  const result = await revokeOtherUserSessions(session.user.id, currentSessionId);

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "SESSIONS_REVOKED_OTHERS",
    entity: "User",
    entityId: session.user.id,
    userId: session.user.id,
    details: {
      revokedCount: result.count,
      keptSessionId: currentSessionId,
      performedBy: session.user.email,
    },
  });

  revalidatePath("/account/sessions");

  return { success: true };
}

export async function revokeDeviceSessionsAction(formData: FormData): Promise<SessionActionResult> {
  const session = await requireSession();

  const parsed = revokeDeviceSchema.safeParse({
    fingerprint: formData.get("fingerprint"),
  });

  if (!parsed.success) {
    return { success: false, error: "Appareil invalide." };
  }

  const currentSessionId = session.user.sessionId;

  if (!currentSessionId) {
    return { success: false, error: "Session actuelle introuvable." };
  }

  const device = parseDeviceFingerprint(parsed.data.fingerprint);
  const isCurrentDevice = formData.get("isCurrentDevice") === "true";

  const result = await revokeUserDeviceSessions(
    session.user.id,
    device,
    isCurrentDevice ? currentSessionId : undefined
  );

  if (result.count === 0) {
    return { success: false, error: "Aucune session à révoquer pour cet appareil." };
  }

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "SESSIONS_REVOKED_DEVICE",
    entity: "User",
    entityId: session.user.id,
    userId: session.user.id,
    details: {
      fingerprint: parsed.data.fingerprint,
      revokedCount: result.count,
      keptSessionId: isCurrentDevice ? currentSessionId : null,
      performedBy: session.user.email,
    },
  });

  revalidatePath("/account/sessions");

  return { success: true };
}

export async function revokeCurrentSessionOnLogout() {
  const session = await auth();

  if (!session?.user.sessionId) {
    return;
  }

  await revokeUserSession(session.user.sessionId, session.user.id);
}
