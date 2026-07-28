import type { ApprovalStatus, PaymentStatus } from "@prisma/client";

import { roundMoney } from "@/lib/transactions/decimal";

export type TreasuryProjectionScenario = "optimistic" | "probable" | "conservative";

const SCENARIO_VALUES: TreasuryProjectionScenario[] = ["optimistic", "probable", "conservative"];

export function parseProjectionScenario(
  value?: string | string[],
  fallback: TreasuryProjectionScenario = "probable"
): TreasuryProjectionScenario {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && SCENARIO_VALUES.includes(raw as TreasuryProjectionScenario)) {
    return raw as TreasuryProjectionScenario;
  }

  return fallback;
}

export function getProjectionScenarioLabel(scenario: TreasuryProjectionScenario): string {
  switch (scenario) {
    case "optimistic":
      return "Optimiste";
    case "conservative":
      return "Prudent";
    default:
      return "Probable";
  }
}

export function getProjectionScenarioHint(scenario: TreasuryProjectionScenario): string {
  switch (scenario) {
    case "optimistic":
      return "100 % des encaissements et décaissements planifiés.";
    case "conservative":
      return "Réservations confirmées (acompte versé) et charges récurrentes approuvées.";
    default:
      return "Pondération selon le statut de paiement et le retard éventuel.";
  }
}

export function getCollectionWeight(
  scenario: TreasuryProjectionScenario,
  status: PaymentStatus | string,
  paidAmount: number,
  isOverdue: boolean
): number {
  if (scenario === "optimistic") {
    return 1;
  }

  if (status === "DEVIS_PROFORMA") {
    return scenario === "probable" ? 0.35 : 0;
  }

  if (paidAmount > 0) {
    if (isOverdue) {
      return scenario === "probable" ? 0.65 : 0.5;
    }

    return scenario === "probable" ? 0.9 : 0.85;
  }

  if (isOverdue) {
    return scenario === "probable" ? 0.5 : 0;
  }

  return scenario === "probable" ? 0.75 : 0;
}

export function getDisbursementWeight(
  scenario: TreasuryProjectionScenario,
  approvalStatus: ApprovalStatus | string,
  isRecurringDue: boolean
): number {
  if (scenario === "optimistic") {
    return 1;
  }

  if (isRecurringDue) {
    return 1;
  }

  if (approvalStatus === "PENDING") {
    return scenario === "probable" ? 0.55 : 0;
  }

  return scenario === "probable" ? 0.95 : 0.95;
}

export function applyScenarioAmount(amount: number, weight: number): number {
  return roundMoney(amount * weight);
}
