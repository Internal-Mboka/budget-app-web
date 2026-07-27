import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";

export type CriticalAlertType =
  | "CASH_CLOSING_DISCREPANCY"
  | "EXPENSE_THRESHOLD_EXCEEDED"
  | "HIGH_VALUE_ADJUSTMENT";

export function areCriticalAlertsEnabled(): boolean {
  const raw = process.env.ALERTS_ENABLED?.trim().toLowerCase();

  if (!raw) {
    return true;
  }

  return raw !== "false" && raw !== "0" && raw !== "off";
}

export function getAlertWebhookUrl(): string | null {
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  return url || null;
}

export function getAlertWebhookSecret(): string | null {
  const secret = process.env.ALERT_WEBHOOK_SECRET?.trim();
  return secret || null;
}

/** Seuil régularisation / avoir — défaut = seuil approbation dépenses. */
export function getHighValueAdjustmentThreshold(): number {
  const raw = process.env.ALERT_ADJUSTMENT_THRESHOLD_USD?.trim();

  if (!raw) {
    return getExpenseApprovalThreshold();
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : getExpenseApprovalThreshold();
}

export function getCriticalAlertTypeLabel(type: CriticalAlertType): string {
  switch (type) {
    case "CASH_CLOSING_DISCREPANCY":
      return "Écart de caisse";
    case "EXPENSE_THRESHOLD_EXCEEDED":
      return "Dépense au-dessus du seuil";
    case "HIGH_VALUE_ADJUSTMENT":
      return "Régularisation de montant élevé";
    default:
      return type;
  }
}
