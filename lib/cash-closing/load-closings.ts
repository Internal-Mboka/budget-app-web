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
