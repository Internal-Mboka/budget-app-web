import type { FiscalPeriodStatus } from "@prisma/client";

export const FISCAL_PERIOD_STATUS_LABELS: Record<FiscalPeriodStatus, string> = {
  PENDING_SETUP: "Configuration en attente",
  OPEN: "Ouvert",
  CLOSING: "Clôture en cours",
  CLOSED: "Clôturé",
};

export function getFiscalPeriodStatusLabel(status: FiscalPeriodStatus): string {
  return FISCAL_PERIOD_STATUS_LABELS[status];
}

export function isFiscalPeriodWritable(status: FiscalPeriodStatus): boolean {
  return status === "OPEN";
}

export function isFiscalPeriodClosing(status: FiscalPeriodStatus): boolean {
  return status === "CLOSING";
}

export function isFiscalPeriodLocked(status: FiscalPeriodStatus): boolean {
  return status === "CLOSING" || status === "CLOSED";
}

export function parseFiscalPeriodStatus(value: string | null | undefined): FiscalPeriodStatus | null {
  if (
    value === "PENDING_SETUP" ||
    value === "OPEN" ||
    value === "CLOSING" ||
    value === "CLOSED"
  ) {
    return value;
  }

  return null;
}
