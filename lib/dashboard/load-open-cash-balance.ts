import type { ClosingReviewStatus } from "@prisma/client";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { formatClosingDateInput, getClosingDayRange } from "@/lib/cash-closing/day-range";
import { computeExpectedClosingBalances } from "@/lib/cash-closing/expected";
import { loadClosingForDate } from "@/lib/cash-closing/load-closings";
import { computeCashClosingDaySummary } from "@/lib/cash-closing/theoretical";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type OpenCashBalanceKpi = {
  total: number;
  hint: string;
  isDayClosed: boolean;
};

const VALIDATED_CLOSING_STATUSES: ClosingReviewStatus[] = ["APPROVED", "RESOLVED"];

function formatClosingDayLabel(closingDate: string): string {
  return format(parseISO(`${closingDate}T12:00:00`), "d MMM yyyy", { locale: fr });
}

async function loadLastValidatedClosingBefore(closingDate: string) {
  const { start } = getClosingDayRange(closingDate);

  return prisma.cashClosing.findFirst({
    where: {
      date: { lt: start },
      reviewStatus: { in: VALIDATED_CLOSING_STATUSES },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      realCash: true,
      realMobileMoney: true,
    },
  });
}

/** Solde espèces + Mobile Money du jour (clôture validée ou attendu si non clôturé). */
export async function loadOpenCashBalance(reference = new Date()): Promise<OpenCashBalanceKpi> {
  const today = formatClosingDateInput(reference);
  const existingClosing = await loadClosingForDate(today);

  if (existingClosing) {
    const closing = await prisma.cashClosing.findUnique({
      where: { id: existingClosing.id },
      select: {
        realCash: true,
        realMobileMoney: true,
        reviewStatus: true,
      },
    });

    if (closing) {
      const total = roundMoney(
        decimalToNumber(closing.realCash) + decimalToNumber(closing.realMobileMoney)
      );
      const dayLabel = formatClosingDayLabel(today);

      if (closing.reviewStatus === "PENDING_REVIEW") {
        return {
          total,
          hint: `Comptage du ${dayLabel} · revue PDG en cours`,
          isDayClosed: true,
        };
      }

      return {
        total,
        hint: `Journée clôturée · ${dayLabel}`,
        isDayClosed: true,
      };
    }
  }

  const [previousClosing, daySummary] = await Promise.all([
    loadLastValidatedClosingBefore(today),
    computeCashClosingDaySummary(today),
  ]);

  const openingCash = previousClosing ? decimalToNumber(previousClosing.realCash) : 0;
  const openingMobileMoney = previousClosing ? decimalToNumber(previousClosing.realMobileMoney) : 0;

  const expected = computeExpectedClosingBalances({
    openingCash,
    openingMobileMoney,
    netCash: daySummary.netCash,
    netMobileMoney: daySummary.netMobileMoney,
  });

  const dayLabel = formatClosingDayLabel(today);

  return {
    total: expected.expectedTotal,
    hint: `Espèces + Mobile Money · ${dayLabel} (non clôturée)`,
    isDayClosed: false,
  };
}
