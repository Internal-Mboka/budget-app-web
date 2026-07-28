export type DashboardAccountingMode = "accrual" | "cash";

const ACCOUNTING_MODE_VALUES: DashboardAccountingMode[] = ["accrual", "cash"];

export function parseDashboardAccountingMode(value?: string | string[]): DashboardAccountingMode {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && ACCOUNTING_MODE_VALUES.includes(raw as DashboardAccountingMode)) {
    return raw as DashboardAccountingMode;
  }

  return "accrual";
}

export function getAccountingModeLabel(mode: DashboardAccountingMode): string {
  return mode === "cash" ? "Encaissement" : "Engagement";
}

export function getAccountingModeDescription(mode: DashboardAccountingMode): string {
  return mode === "cash"
    ? "Montants basés sur les dates de paiement effectif."
    : "Montants basés sur la date d'enregistrement (engagement).";
}
