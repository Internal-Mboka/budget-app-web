import {
  buildSequentialFiscalPeriodLabel,
  computeFiscalPeriodEndDate,
  normalizeFiscalPeriodEndDate,
  normalizeFiscalPeriodStartDate,
} from "@/lib/fiscal-period/dates";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { hasAnyFiscalPeriod } from "@/lib/fiscal-period/load-fiscal-periods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type InitializeFirstFiscalPeriodInput = {
  startDate: Date;
  skipOpeningBalance: boolean;
  openingBalanceCash?: number;
  openingBalanceMobile?: number;
  openingBalanceBank?: number;
};

export type InitializeFirstFiscalPeriodResult =
  | { success: true; period: FiscalPeriodRecord }
  | { success: false; error: string };

const fiscalPeriodSelect = {
  id: true,
  label: true,
  startDate: true,
  endDate: true,
  status: true,
  closedAt: true,
  openingBalanceCash: true,
  openingBalanceMobile: true,
  openingBalanceBank: true,
  skipOpeningBalance: true,
  validatedByPdgId: true,
  validatedByAccountantId: true,
} as const;

export async function initializeFirstFiscalPeriod(
  input: InitializeFirstFiscalPeriodInput
): Promise<InitializeFirstFiscalPeriodResult> {
  if (await hasAnyFiscalPeriod()) {
    return { success: false, error: "Un trimestre comptable existe déjà." };
  }

  const startDate = normalizeFiscalPeriodStartDate(input.startDate);
  const endDate = normalizeFiscalPeriodEndDate(computeFiscalPeriodEndDate(startDate));
  const label = buildSequentialFiscalPeriodLabel(1, startDate);
  const skipOpeningBalance = input.skipOpeningBalance;

  try {
    const row = await prisma.fiscalPeriod.create({
      data: {
        label,
        startDate,
        endDate,
        status: "OPEN",
        skipOpeningBalance,
        openingBalanceCash:
          skipOpeningBalance || input.openingBalanceCash === undefined
            ? null
            : input.openingBalanceCash,
        openingBalanceMobile:
          skipOpeningBalance || input.openingBalanceMobile === undefined
            ? null
            : input.openingBalanceMobile,
        openingBalanceBank:
          skipOpeningBalance || input.openingBalanceBank === undefined
            ? null
            : input.openingBalanceBank,
      },
      select: fiscalPeriodSelect,
    });

    return {
      success: true,
      period: {
        id: row.id,
        label: row.label,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        closedAt: row.closedAt?.toISOString() ?? null,
        openingBalanceCash:
          row.openingBalanceCash === null ? null : roundMoney(decimalToNumber(row.openingBalanceCash)),
        openingBalanceMobile:
          row.openingBalanceMobile === null ? null : roundMoney(decimalToNumber(row.openingBalanceMobile)),
        openingBalanceBank:
          row.openingBalanceBank === null ? null : roundMoney(decimalToNumber(row.openingBalanceBank)),
        skipOpeningBalance: row.skipOpeningBalance,
        validatedByPdgId: row.validatedByPdgId,
        validatedByAccountantId: row.validatedByAccountantId,
      },
    };
  } catch (error) {
    console.error("initializeFirstFiscalPeriod failed", error);
    return { success: false, error: "Impossible d'initialiser le trimestre comptable." };
  }
}
