"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { initializeFirstFiscalPeriod } from "@/lib/fiscal-period/initialize-first-period";
import { requiresFiscalPeriodSetup } from "@/lib/fiscal-period/load-fiscal-periods";
import { ROLES } from "@/lib/permissions";
import { parseFiscalPeriodSetupFormData } from "@/lib/validations/fiscal-period-setup";

export type FiscalPeriodSetupActionResult =
  | { success: true; periodLabel: string }
  | { success: false; error: string };

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

export type FiscalPeriodSetupFormState = FiscalPeriodSetupActionResult | null;

export async function initializeFiscalPeriodFormAction(
  _prevState: FiscalPeriodSetupFormState,
  formData: FormData
): Promise<FiscalPeriodSetupFormState> {
  const result = await initializeFiscalPeriodAction(formData);

  if (result.success) {
    redirect("/dashboard?fiscalPeriodInitialized=1");
  }

  return result;
}

export async function initializeFiscalPeriodAction(
  formData: FormData
): Promise<FiscalPeriodSetupActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (session.user.roleName !== ROLES.PDG) {
    return { success: false, error: "Seul le PDG peut initialiser le 1er trimestre comptable." };
  }

  if (!(await requiresFiscalPeriodSetup())) {
    return { success: false, error: "Un trimestre comptable est déjà ouvert." };
  }

  let parsed;

  try {
    parsed = parseFiscalPeriodSetupFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const result = await initializeFirstFiscalPeriod({
    startDate: new Date(`${parsed.startDate}T12:00:00`),
    skipOpeningBalance: parsed.skipOpeningBalance,
    openingBalanceCash: parsed.openingBalanceCash,
    openingBalanceMobile: parsed.openingBalanceMobile,
    openingBalanceBank: parsed.openingBalanceBank,
  });

  if (!result.success) {
    return result;
  }

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "FISCAL_PERIOD_INITIALIZED",
    entity: "FiscalPeriod",
    entityId: result.period.id,
    userId: session.user.id,
    details: {
      label: result.period.label,
      startDate: result.period.startDate,
      endDate: result.period.endDate,
      skipOpeningBalance: result.period.skipOpeningBalance,
      openingBalanceCash: result.period.openingBalanceCash,
      openingBalanceMobile: result.period.openingBalanceMobile,
      openingBalanceBank: result.period.openingBalanceBank,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/setup");
  revalidatePath("/revenues");
  revalidatePath("/expenses");

  return { success: true, periodLabel: result.period.label };
}
