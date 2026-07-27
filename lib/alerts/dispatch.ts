import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  areCriticalAlertsEnabled,
  getAlertWebhookSecret,
  getAlertWebhookUrl,
  getCriticalAlertTypeLabel,
  type CriticalAlertType,
} from "@/lib/alerts/config";
import { loadLeadershipAlertRecipients } from "@/lib/alerts/recipients";
import { writeAuditLog } from "@/lib/audit";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";

export type CriticalAlertPayload = {
  type: CriticalAlertType;
  title: string;
  message: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  triggeredByUserId?: string;
};

async function postAlertWebhook(payload: CriticalAlertPayload, recipients: string[]): Promise<boolean> {
  const url = getAlertWebhookUrl();

  if (!url) {
    return false;
  }

  const secret = getAlertWebhookSecret();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (secret) {
    headers["X-Mboka-Alert-Secret"] = secret;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "mboka-budget",
        emittedAt: new Date().toISOString(),
        alertType: payload.type,
        alertLabel: getCriticalAlertTypeLabel(payload.type),
        title: payload.title,
        message: payload.message,
        entity: payload.entity ?? null,
        entityId: payload.entityId ?? null,
        details: payload.details ?? {},
        recipients,
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

/** Dispatch email + webhook — n'interrompt jamais le flux métier appelant. */
export async function dispatchCriticalAlert(payload: CriticalAlertPayload): Promise<void> {
  if (!areCriticalAlertsEnabled()) {
    return;
  }

  try {
    const recipients = await loadLeadershipAlertRecipients();

    if (recipients.length === 0) {
      console.warn("[alert:no-recipients]", payload.type);
      return;
    }

    const timestamp = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });
    const subject = `Mboka Budget — Alerte · ${getCriticalAlertTypeLabel(payload.type)}`;
    const text = `${payload.title}

${payload.message}

Horodatage : ${timestamp}
Type : ${getCriticalAlertTypeLabel(payload.type)}
${payload.entity ? `Entité : ${payload.entity}` : ""}
${payload.entityId ? `Référence : ${payload.entityId}` : ""}

— Mboka Budget`;

    const [emailSent, webhookSent] = await Promise.all([
      sendTransactionalEmail({ to: recipients, subject, text }),
      postAlertWebhook(payload, recipients),
    ]);

    if (payload.triggeredByUserId) {
      await writeAuditLog({
        action: "CRITICAL_ALERT_DISPATCHED",
        entity: payload.entity ?? "System",
        entityId: payload.entityId,
        userId: payload.triggeredByUserId,
        details: {
          alertType: payload.type,
          title: payload.title,
          emailSent,
          webhookSent,
          recipientCount: recipients.length,
        },
      });
    }
  } catch (error) {
    console.error("[alert:dispatch-error]", payload.type, error);
  }
}

export async function notifyCashClosingDiscrepancy(input: {
  closingId: string;
  closingDate: string;
  gapAmount: number;
  operatorEmail: string;
  triggeredByUserId: string;
}): Promise<void> {
  await dispatchCriticalAlert({
    type: "CASH_CLOSING_DISCREPANCY",
    title: "Écart de caisse détecté",
    message: `Une clôture du ${input.closingDate} présente un écart de ${input.gapAmount.toFixed(2)} USD. Opérateur : ${input.operatorEmail}. Revue PDG requise.`,
    entity: "CashClosing",
    entityId: input.closingId,
    details: {
      closingDate: input.closingDate,
      gapAmount: input.gapAmount,
      operatorEmail: input.operatorEmail,
    },
    triggeredByUserId: input.triggeredByUserId,
  });
}

export async function notifyExpenseThresholdExceeded(input: {
  transactionId: string;
  code: string;
  totalAmount: number;
  expenseCategoryLabel: string;
  creatorEmail: string;
  approvalPending: boolean;
  triggeredByUserId: string;
}): Promise<void> {
  await dispatchCriticalAlert({
    type: "EXPENSE_THRESHOLD_EXCEEDED",
    title: `Dépense ${input.code} au-dessus du seuil`,
    message: `${input.expenseCategoryLabel} — ${input.totalAmount.toFixed(2)} USD enregistrée par ${input.creatorEmail}.${
      input.approvalPending ? " Approbation PDG en attente." : ""
    }`,
    entity: "Transaction",
    entityId: input.transactionId,
    details: {
      code: input.code,
      totalAmount: input.totalAmount,
      approvalPending: input.approvalPending,
    },
    triggeredByUserId: input.triggeredByUserId,
  });
}

export async function notifyHighValueAdjustment(input: {
  adjustmentId: string;
  adjustmentCode: string;
  parentCode: string;
  amount: number;
  reason: string;
  performerEmail: string;
  triggeredByUserId: string;
}): Promise<void> {
  await dispatchCriticalAlert({
    type: "HIGH_VALUE_ADJUSTMENT",
    title: `Régularisation ${input.adjustmentCode} — montant élevé`,
    message: `Avoir/régularisation de ${input.amount.toFixed(2)} USD sur ${input.parentCode}. Motif : ${input.reason}. Par ${input.performerEmail}.`,
    entity: "Transaction",
    entityId: input.adjustmentId,
    details: {
      adjustmentCode: input.adjustmentCode,
      parentCode: input.parentCode,
      amount: input.amount,
      reason: input.reason,
    },
    triggeredByUserId: input.triggeredByUserId,
  });
}

export async function notifyFiscalPeriodClosingPending(input: {
  periodId: string;
  periodLabel: string;
  endDate: string;
  triggeredByUserId: string;
}): Promise<void> {
  await dispatchCriticalAlert({
    type: "FISCAL_PERIOD_CLOSING_PENDING",
    title: `Clôture ${input.periodLabel} — action requise`,
    message: `Le trimestre ${input.periodLabel} est en clôture. Visa comptable puis validation PDG attendus.`,
    entity: "FiscalPeriod",
    entityId: input.periodId,
    details: {
      periodLabel: input.periodLabel,
      endDate: input.endDate,
    },
    triggeredByUserId: input.triggeredByUserId,
  });
}

export async function notifyFiscalPeriodClosingApproved(input: {
  periodId: string;
  periodLabel: string;
  performerEmail: string;
  triggeredByUserId: string;
}): Promise<void> {
  await dispatchCriticalAlert({
    type: "FISCAL_PERIOD_CLOSING_APPROVED",
    title: `Clôture ${input.periodLabel} validée`,
    message: `Le trimestre ${input.periodLabel} a été validé par ${input.performerEmail}. Finalisation T+1 à venir.`,
    entity: "FiscalPeriod",
    entityId: input.periodId,
    details: {
      periodLabel: input.periodLabel,
      performerEmail: input.performerEmail,
    },
    triggeredByUserId: input.triggeredByUserId,
  });
}
