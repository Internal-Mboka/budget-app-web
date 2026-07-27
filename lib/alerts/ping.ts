import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { getCriticalAlertTypeLabel, type CriticalAlertType } from "@/lib/alerts/config";
import { loadAlertRuntimeConfig } from "@/lib/alerts/load-settings";
import { loadLeadershipAlertRecipients } from "@/lib/alerts/recipients";
import { writeAuditLog } from "@/lib/audit";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";

export type AlertPingResult =
  | {
      success: true;
      emailSent: boolean;
      webhookSent: boolean;
      recipientCount: number;
    }
  | { success: false; error: string };

async function postAlertWebhook(input: {
  url: string;
  secret: string | null;
  payload: {
    type: CriticalAlertType;
    title: string;
    message: string;
    entity?: string;
    entityId?: string;
    details?: Record<string, unknown>;
  };
  recipients: string[];
}): Promise<boolean> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (input.secret) {
    headers["X-Mboka-Alert-Secret"] = input.secret;
  }

  try {
    const response = await fetch(input.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "mboka-budget",
        emittedAt: new Date().toISOString(),
        alertType: input.payload.type,
        alertLabel: getCriticalAlertTypeLabel(input.payload.type),
        title: input.payload.title,
        message: input.payload.message,
        entity: input.payload.entity ?? null,
        entityId: input.payload.entityId ?? null,
        details: input.payload.details ?? {},
        recipients: input.recipients,
        test: true,
      }),
    });

    if (!response.ok) {
      console.error("[alert:webhook-error]", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[alert:webhook-error]", error);
    return false;
  }
}

/** US-58 : ping de validation email + webhook pour PDG/DT. */
export async function sendAlertIntegrationPing(input: {
  triggeredByUserId: string;
  performerEmail: string;
}): Promise<AlertPingResult> {
  const config = await loadAlertRuntimeConfig();

  if (!config.alertsEnabled) {
    return { success: false, error: "Les alertes critiques sont désactivées." };
  }

  const recipients = await loadLeadershipAlertRecipients();

  if (recipients.length === 0) {
    return { success: false, error: "Aucun destinataire direction actif trouvé." };
  }

  const timestamp = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });
  const title = "Test d'intégration alertes Mboka Budget";
  const message = `Ping de validation déclenché par ${input.performerEmail}. Si vous recevez ce message, la chaîne d'alerte est opérationnelle.`;

  let emailSent = false;
  let webhookSent = false;

  if (config.emailEnabled) {
    if (!config.emailProviderConfigured) {
      emailSent = true;
    } else {
      emailSent = await sendTransactionalEmail({
        to: recipients,
        subject: "Mboka Budget — Test alerte",
        text: `${title}

${message}

Horodatage : ${timestamp}

— Mboka Budget`,
      });
    }
  }

  if (config.webhookEnabled && config.webhookUrl) {
    webhookSent = await postAlertWebhook({
      url: config.webhookUrl,
      secret: config.webhookSecret,
      payload: {
        type: "EXPENSE_THRESHOLD_EXCEEDED",
        title,
        message,
        entity: "System",
        details: { ping: true, triggeredBy: input.performerEmail },
      },
      recipients,
    });
  }

  if (!config.emailEnabled && !(config.webhookEnabled && config.webhookUrl)) {
    return { success: false, error: "Activez au moins un canal (email ou messagerie) pour lancer le test." };
  }

  if (config.emailEnabled && config.emailProviderConfigured && !emailSent) {
    return { success: false, error: "L'envoi par email a échoué. Vérifiez la configuration du serveur mail." };
  }

  if (config.webhookEnabled && config.webhookUrl && !webhookSent) {
    return { success: false, error: "Le canal messagerie n'a pas répondu ou a refusé le message." };
  }

  await writeAuditLog({
    action: "ALERT_INTEGRATION_PING_SENT",
    entity: "AlertSettings",
    entityId: "default",
    userId: input.triggeredByUserId,
    details: {
      emailSent: config.emailEnabled ? emailSent : null,
      webhookSent: config.webhookEnabled ? webhookSent : null,
      recipientCount: recipients.length,
    },
  });

  return {
    success: true,
    emailSent: config.emailEnabled && emailSent,
    webhookSent: config.webhookEnabled && webhookSent,
    recipientCount: recipients.length,
  };
}
