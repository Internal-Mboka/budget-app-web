"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getClosingDayRange } from "@/lib/cash-closing/day-range";
import { computeCashClosingGap } from "@/lib/cash-closing/gap";
import { computeTheoreticalCashBalances } from "@/lib/cash-closing/theoretical";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roundMoney } from "@/lib/transactions/decimal";
import { parseCreateCashClosingFormData } from "@/lib/validations/cash-closing";

export type CashClosingActionResult =
  | { success: true; closingId: string }
  | { success: false; error: string };

export type CashClosingFormState = CashClosingActionResult | null;

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

export async function createCashClosingFormAction(
  _prevState: CashClosingFormState,
  formData: FormData
): Promise<CashClosingFormState> {
  const result = await createCashClosingAction(formData);

  if (result.success) {
    redirect(`/cash-closing/${result.closingId}?created=1`);
  }

  return result;
}

export async function createCashClosingAction(formData: FormData): Promise<CashClosingActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.CASH_CLOSE)) {
    return { success: false, error: "Permission insuffisante pour effectuer une clôture de caisse." };
  }

  let parsed;

  try {
    parsed = parseCreateCashClosingFormData(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) };
    }

    return { success: false, error: "Données invalides." };
  }

  const closingDateInput = String(formData.get("closingDate") ?? "");
  const { start, end, date } = getClosingDayRange(closingDateInput);
  const realCash = roundMoney(parsed.realCash);
  const realMobileMoney = roundMoney(parsed.realMobileMoney);

  const existingClosing = await prisma.cashClosing.findFirst({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });

  if (existingClosing) {
    return { success: false, error: "Une clôture existe déjà pour cette journée." };
  }

  const theoretical = await computeTheoreticalCashBalances(closingDateInput);
  const { gapAmount, hasDiscrepancy } = computeCashClosingGap({
    theoreticalCash: theoretical.theoreticalCash,
    theoreticalMobileMoney: theoretical.theoreticalMobileMoney,
    realCash,
    realMobileMoney,
  });

  try {
    const closing = await prisma.$transaction(async (tx) => {
      const created = await tx.cashClosing.create({
        data: {
          date,
          theoreticalCash: new Prisma.Decimal(theoretical.theoreticalCash),
          theoreticalMobileMoney: new Prisma.Decimal(theoretical.theoreticalMobileMoney),
          realCash: new Prisma.Decimal(realCash),
          realMobileMoney: new Prisma.Decimal(realMobileMoney),
          gapAmount: new Prisma.Decimal(gapAmount),
          hasDiscrepancy,
          operatorId: session.user.id,
          reviewStatus: hasDiscrepancy ? "PENDING_REVIEW" : "APPROVED",
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          action: "CASH_CLOSING_CREATED",
          entity: "CashClosing",
          entityId: created.id,
          userId: session.user.id,
          details: {
            closingDate: closingDateInput,
            theoreticalCash: theoretical.theoreticalCash,
            theoreticalMobileMoney: theoretical.theoreticalMobileMoney,
            realCash,
            realMobileMoney,
            gapAmount,
            hasDiscrepancy,
            transactionCount: theoretical.transactionCount,
            performedBy: session.user.email,
          },
        },
      });

      return created;
    });

    revalidatePath("/cash-closing");
    revalidatePath(`/cash-closing/${closing.id}`);
    revalidatePath("/dashboard/financier");

    return { success: true, closingId: closing.id };
  } catch (error) {
    console.error("createCashClosingAction failed", error);
    return { success: false, error: "Impossible d'enregistrer la clôture de caisse." };
  }
}
