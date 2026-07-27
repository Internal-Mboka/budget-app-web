"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { notifyFiscalPeriodClosingApproved } from "@/lib/alerts/dispatch";
import { getSession } from "@/lib/auth/get-session";
import { isPdgSoloFiscalClosingEnabled } from "@/lib/fiscal-period/closing-config";
import {
  canApproveFiscalPeriodClosingAsPdg,
  canVisaFiscalPeriodClosingAsAccountant,
  getFiscalPeriodClosingWorkflowStep,
} from "@/lib/fiscal-period/closing-workflow";
import { loadFiscalPeriodClosingById } from "@/lib/fiscal-period/load-closing-queue";
import { prisma } from "@/lib/prisma";

export type FiscalPeriodClosingActionResult =
  | { success: true }
  | { success: false; error: string };

const CLOSING_PATH = "/dashboard/cloture-trimestre";

function revalidateClosingSurfaces() {
  revalidatePath(CLOSING_PATH);
  revalidatePath("/dashboard");
  revalidatePath("/revenues");
  revalidatePath("/expenses");
}

export async function visaFiscalPeriodClosingAsAccountantAction(
  periodId: string
): Promise<FiscalPeriodClosingActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!canVisaFiscalPeriodClosingAsAccountant(session.user.roleName)) {
    return { success: false, error: "Visa comptable réservé au rôle Comptable." };
  }

  const period = await loadFiscalPeriodClosingById(periodId);

  if (!period) {
    return { success: false, error: "Trimestre introuvable ou déjà traité." };
  }

  if (period.validatedByAccountantId) {
    return { success: false, error: "Le visa comptable a déjà été enregistré." };
  }

  if (getFiscalPeriodClosingWorkflowStep(period) !== "pending_accountant") {
    return { success: false, error: "Ce trimestre n'attend pas de visa comptable." };
  }

  try {
    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.fiscalPeriod.update({
        where: { id: period.id },
        data: { validatedByAccountantId: session.user.id },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "FISCAL_PERIOD_CLOSING_ACCOUNTANT_APPROVED",
        entity: "FiscalPeriod",
        entityId: period.id,
        userId: session.user.id,
        details: {
          label: period.label,
          validatedBy: session.user.email,
        },
      });
    });

    revalidateClosingSurfaces();
    return { success: true };
  } catch (error) {
    console.error("visaFiscalPeriodClosingAsAccountantAction failed", error);
    return { success: false, error: "Impossible d'enregistrer le visa comptable." };
  }
}

export async function approveFiscalPeriodClosingAsPdgAction(
  periodId: string
): Promise<FiscalPeriodClosingActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!canApproveFiscalPeriodClosingAsPdg(session.user.roleName)) {
    return { success: false, error: "Validation finale réservée au PDG ou au Directeur Technique." };
  }

  const period = await loadFiscalPeriodClosingById(periodId);
  const pdgSolo = isPdgSoloFiscalClosingEnabled();

  if (!period) {
    return { success: false, error: "Trimestre introuvable ou déjà traité." };
  }

  if (period.validatedByPdgId) {
    return { success: false, error: "Ce trimestre est déjà validé." };
  }

  if (!pdgSolo && !period.validatedByAccountantId) {
    return {
      success: false,
      error: "Le visa comptable est requis avant la validation PDG.",
    };
  }

  if (getFiscalPeriodClosingWorkflowStep(period) !== "pending_pdg") {
    return { success: false, error: "Ce trimestre n'attend pas de validation PDG." };
  }

  try {
    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.fiscalPeriod.update({
        where: { id: period.id },
        data: { validatedByPdgId: session.user.id },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "FISCAL_PERIOD_CLOSING_APPROVED",
        entity: "FiscalPeriod",
        entityId: period.id,
        userId: session.user.id,
        details: {
          label: period.label,
          validatedBy: session.user.email,
          pdgSolo,
          accountantVisaId: period.validatedByAccountantId,
        },
      });
    });

    void notifyFiscalPeriodClosingApproved({
      periodId: period.id,
      periodLabel: period.label,
      triggeredByUserId: session.user.id,
      performerEmail: session.user.email ?? "",
    });

    revalidateClosingSurfaces();
    return { success: true };
  } catch (error) {
    console.error("approveFiscalPeriodClosingAsPdgAction failed", error);
    return { success: false, error: "Impossible de valider la clôture trimestrielle." };
  }
}

export type FiscalPeriodClosingFormState = FiscalPeriodClosingActionResult | null;

export async function visaFiscalPeriodClosingFormAction(
  _prevState: FiscalPeriodClosingFormState,
  formData: FormData
): Promise<FiscalPeriodClosingFormState> {
  const periodId = String(formData.get("periodId") ?? "").trim();
  const result = await visaFiscalPeriodClosingAsAccountantAction(periodId);

  if (result.success) {
    redirect(`${CLOSING_PATH}?visa=1`);
  }

  return result;
}

export async function approveFiscalPeriodClosingFormAction(
  _prevState: FiscalPeriodClosingFormState,
  formData: FormData
): Promise<FiscalPeriodClosingFormState> {
  const periodId = String(formData.get("periodId") ?? "").trim();
  const result = await approveFiscalPeriodClosingAsPdgAction(periodId);

  if (result.success) {
    redirect(`${CLOSING_PATH}?approved=1`);
  }

  return result;
}
