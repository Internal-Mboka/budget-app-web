import { getClosingDayRange } from "@/lib/cash-closing/day-range";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type CashClosingHistoryItem = {
  id: string;
  date: string;
  gapAmount: number;
  hasDiscrepancy: boolean;
  createdAt: string;
  operator: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

export async function loadClosingForDate(
  closingDate: string
): Promise<{ id: string; date: string } | null> {
  const { start, end } = getClosingDayRange(closingDate);

  const closing = await prisma.cashClosing.findFirst({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      date: true,
    },
  });

  if (!closing) {
    return null;
  }

  return {
    id: closing.id,
    date: closing.date.toISOString(),
  };
}

export async function loadRecentCashClosings(limit = 20): Promise<CashClosingHistoryItem[]> {
  const rows = await prisma.cashClosing.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      date: true,
      gapAmount: true,
      hasDiscrepancy: true,
      createdAt: true,
      operator: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    date: row.date.toISOString(),
    gapAmount: decimalToNumber(row.gapAmount),
    hasDiscrepancy: row.hasDiscrepancy,
    createdAt: row.createdAt.toISOString(),
    operator: row.operator,
  }));
}

export type SuggestedOpeningFloat = {
  openingCash: number;
  openingMobileMoney: number;
  sourceClosingDate: string;
};

/** Reprend les montants comptés à la dernière clôture avant la date choisie. */
export async function loadSuggestedOpeningFloat(
  closingDate: string
): Promise<SuggestedOpeningFloat | null> {
  const { start } = getClosingDayRange(closingDate);

  const previous = await prisma.cashClosing.findFirst({
    where: { date: { lt: start } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      date: true,
      realCash: true,
      realMobileMoney: true,
    },
  });

  if (!previous) {
    return null;
  }

  return {
    openingCash: decimalToNumber(previous.realCash),
    openingMobileMoney: decimalToNumber(previous.realMobileMoney),
    sourceClosingDate: previous.date.toISOString(),
  };
}
