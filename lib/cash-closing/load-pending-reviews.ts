import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type PendingCashClosingReviewItem = {
  id: string;
  date: string;
  gapAmount: number;
  notes: string | null;
  operator: {
    firstName: string;
    lastName: string;
  };
};

const pendingReviewSelect = {
  id: true,
  date: true,
  gapAmount: true,
  notes: true,
  operator: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const;

function mapPendingReviewRow(row: {
  id: string;
  date: Date;
  gapAmount: { toString(): string };
  notes: string | null;
  operator: PendingCashClosingReviewItem["operator"];
}): PendingCashClosingReviewItem {
  return {
    id: row.id,
    date: row.date.toISOString(),
    gapAmount: decimalToNumber(row.gapAmount),
    notes: row.notes,
    operator: row.operator,
  };
}

export async function loadPendingCashClosingReviews(
  limit = 20
): Promise<PendingCashClosingReviewItem[]> {
  const rows = await prisma.cashClosing.findMany({
    where: {
      hasDiscrepancy: true,
      reviewStatus: "PENDING_REVIEW",
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: pendingReviewSelect,
  });

  return rows.map(mapPendingReviewRow);
}

export async function countPendingCashClosingReviews(): Promise<number> {
  return prisma.cashClosing.count({
    where: {
      hasDiscrepancy: true,
      reviewStatus: "PENDING_REVIEW",
    },
  });
}
