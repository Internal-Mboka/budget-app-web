import { isPdgSoloFiscalClosingEnabled } from "@/lib/fiscal-period/closing-config";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { ROLES, type RoleName } from "@/lib/permissions";

export type FiscalPeriodClosingWorkflowStep =
  | "pending_accountant"
  | "pending_pdg"
  | "approved";

export function getFiscalPeriodClosingWorkflowStep(
  period: FiscalPeriodRecord,
  pdgSolo = isPdgSoloFiscalClosingEnabled()
): FiscalPeriodClosingWorkflowStep {
  if (period.validatedByPdgId) {
    return "approved";
  }

  if (pdgSolo || period.validatedByAccountantId) {
    return "pending_pdg";
  }

  return "pending_accountant";
}

export function canVisaFiscalPeriodClosingAsAccountant(roleName: RoleName): boolean {
  return roleName === ROLES.COMPTABLE;
}

export function canApproveFiscalPeriodClosingAsPdg(roleName: RoleName): boolean {
  return roleName === ROLES.PDG || roleName === ROLES.DIRECTEUR_TECHNIQUE;
}

export function canAccessFiscalPeriodClosingPage(roleName: RoleName): boolean {
  return (
    canVisaFiscalPeriodClosingAsAccountant(roleName) ||
    canApproveFiscalPeriodClosingAsPdg(roleName)
  );
}

export function getFiscalPeriodClosingWorkflowLabel(step: FiscalPeriodClosingWorkflowStep): string {
  switch (step) {
    case "pending_accountant":
      return "Visa comptable en attente";
    case "pending_pdg":
      return "Validation PDG en attente";
    case "approved":
      return "Clôture validée";
  }
}
