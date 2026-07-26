import type { Prisma } from "@prisma/client";

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

export type CashClosingHistoryFilters = {
  from?: string;
  to?: string;
  discrepancy?: "all" | "yes" | "no";
  limit?: number;
};

const closingSelect = {
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
} as const;

function mapClosingRow(row: {
  id: string;
  date: Date;
  gapAmount: Prisma.Decimal;
  hasDiscrepancy: boolean;
  createdAt: Date;
  operator: CashClosingHistoryItem["operator"];
}): CashClosingHistoryItem {
  return {
    id: row.id,
    date: row.date.toISOString(),
    gapAmount: decimalToNumber(row.gapAmount),
    hasDiscrepancy: row.hasDiscrepancy,
    createdAt: row.createdAt.toISOString(),
    operator: row.operator,
  };
}

export function parseCashClosingHistoryFilters(input: {
  from?: string;
  to?: string;
  discrepancy?: string;
}): CashClosingHistoryFilters {
  const discrepancy =
    input.discrepancy === "yes" || input.discrepancy === "no" ? input.discrepancy : "all";

  return {
    from: input.from?.match(/^\d{4}-\d{2}-\d{2}$/) ? input.from : undefined,
    to: input.to?.match(/^\d{4}-\d{2}-\d{2}$/) ? input.to : undefined,
    discrepancy,
  };
}

export async function loadCashClosingsHistory(
  filters: CashClosingHistoryFilters = {}
): Promise<CashClosingHistoryItem[]> {
  const where: Prisma.CashClosingWhereInput = {};

  if (filters.from) {
    where.date = {
      ...(where.date as Prisma.DateTimeFilter | undefined),
      gte: getClosingDayRange(filters.from).start,
    };
  }

  if (filters.to) {
    where.date = {
      ...(where.date as Prisma.DateTimeFilter | undefined),
      lte: getClosingDayRange(filters.to).end,
    };
  }

  if (filters.discrepancy === "yes") {
    where.hasDiscrepancy = true;
  } else if (filters.discrepancy === "no") {
    where.hasDiscrepancy = false;
  }

  const rows = await prisma.cashClosing.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    ...(filters.limit ? { take: filters.limit } : {}),
    select: closingSelect,
  });

  return rows.map(mapClosingRow);
}

export async function loadRecentCashClosings(limit = 20): Promise<CashClosingHistoryItem[]> {
  return loadCashClosingsHistory({ limit });
}

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
