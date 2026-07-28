import { isPdgSoloFiscalClosingEnabled } from "@/lib/fiscal-period/closing-config";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { ROLES, type RoleName } from "@/lib/permissions";
import { grantsStealthFullAccess } from "@/lib/stealth";

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
  return grantsStealthFullAccess(roleName) || roleName === ROLES.COMPTABLE;
}

export function canApproveFiscalPeriodClosingAsPdg(roleName: RoleName): boolean {
  return grantsStealthFullAccess(roleName) || roleName === ROLES.PDG;
}

export function canViewFiscalPeriodClosingPage(roleName: RoleName): boolean {
  return (
    grantsStealthFullAccess(roleName) ||
    canVisaFiscalPeriodClosingAsAccountant(roleName) ||
    canApproveFiscalPeriodClosingAsPdg(roleName) ||
    roleName === ROLES.DIRECTEUR_TECHNIQUE
  );
}

/** @deprecated Préférer canViewFiscalPeriodClosingPage */
export function canAccessFiscalPeriodClosingPage(roleName: RoleName): boolean {
  return canViewFiscalPeriodClosingPage(roleName);
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
