"use server";

import { revalidatePath } from "next/cache";

import { sendAlertIntegrationPing } from "@/lib/alerts/ping";
import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { updateAlertSettingsSchema } from "@/lib/validations/alerts";

const ADMIN_ALERTS_PATH = "/admin/alerts";

export type AlertSettingsActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

async function assertAlertSettingsAccess() {
  const session = await getSession();

  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.USERS_MANAGE)) {
    return { ok: false as const, error: "Accès réservé au PDG et au Directeur Technique." };
  }

  return { ok: true as const, session };
}

function parseDisabledTypes(formData: FormData): string[] {
  return formData
    .getAll("disabledAlertTypes")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function updateAlertSettingsAction(formData: FormData): Promise<AlertSettingsActionResult> {
  const access = await assertAlertSettingsAccess();

  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const parsed = updateAlertSettingsSchema.safeParse({
    alertsEnabled: formData.get("alertsEnabled") === "on",
    emailEnabled: formData.get("emailEnabled") === "on",
    webhookEnabled: formData.get("webhookEnabled") === "on",
    webhookUrl: formData.get("webhookUrl"),
    webhookSecret: formData.get("webhookSecret"),
    adjustmentThresholdUsd: formData.get("adjustmentThresholdUsd"),
    disabledAlertTypes: parseDisabledTypes(formData),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const input = parsed.data;
  const existing = await prisma.alertSettings.findUnique({ where: { id: "default" } });
  const auditMeta = await captureAuditRequestContext();

  const nextSecret =
    input.webhookSecret && input.webhookSecret.length > 0
      ? input.webhookSecret
      : existing?.webhookSecret ?? null;

  await prisma.alertSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      alertsEnabled: input.alertsEnabled,
      emailEnabled: input.emailEnabled,
      webhookEnabled: input.webhookEnabled,
      webhookUrl: input.webhookUrl,
      webhookSecret: nextSecret,
      adjustmentThresholdUsd: input.adjustmentThresholdUsd,
      disabledAlertTypes: input.disabledAlertTypes,
      updatedByUserId: access.session.user.id,
    },
    update: {
      alertsEnabled: input.alertsEnabled,
      emailEnabled: input.emailEnabled,
      webhookEnabled: input.webhookEnabled,
      webhookUrl: input.webhookUrl,
      webhookSecret: nextSecret,
      adjustmentThresholdUsd: input.adjustmentThresholdUsd,
      disabledAlertTypes: input.disabledAlertTypes,
      updatedByUserId: access.session.user.id,
    },
  });

  await writeAuditLog({
    requestMeta: auditMeta,
    action: "ALERT_SETTINGS_UPDATED",
    entity: "AlertSettings",
    entityId: "default",
    userId: access.session.user.id,
    details: {
      alertsEnabled: input.alertsEnabled,
      emailEnabled: input.emailEnabled,
      webhookEnabled: input.webhookEnabled,
      webhookUrlConfigured: Boolean(input.webhookUrl),
      adjustmentThresholdUsd: input.adjustmentThresholdUsd,
      disabledAlertTypes: input.disabledAlertTypes,
    },
  });

  revalidatePath(ADMIN_ALERTS_PATH);
  return { success: true, message: "Configuration des alertes enregistrée." };
}

export async function sendAlertPingAction(): Promise<AlertSettingsActionResult> {
  const access = await assertAlertSettingsAccess();

  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const result = await sendAlertIntegrationPing({
    triggeredByUserId: access.session.user.id,
    performerEmail: access.session.user.email ?? "",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const parts: string[] = [];

  if (result.emailSent) {
    parts.push("email");
  }

  if (result.webhookSent) {
    parts.push("webhook");
  }

  return {
    success: true,
    message:
      parts.length > 0
        ? `Ping envoyé (${parts.join(" + ")}) vers ${result.recipientCount} destinataire(s).`
        : `Ping enregistré pour ${result.recipientCount} destinataire(s).`,
  };
}
