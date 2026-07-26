import { getClosingDayRange } from "@/lib/cash-closing/day-range";
import {
  accumulateExpenseMovement,
  accumulateRevenueMovements,
  createEmptyMovementBuckets,
} from "@/lib/cash-closing/movements";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

/** Résumé des mouvements du jour par mode de paiement. */
export type CashClosingDaySummary = {
  closingDate: string;
  netCash: number;
  netMobileMoney: number;
  netBankTransfer: number;
  netOther: number;
  liquidTransactionCount: number;
  otherTransactionCount: number;
};

/** @deprecated Alias conservé pour compatibilité interne. */
export type TheoreticalCashBalances = CashClosingDaySummary & {
  theoreticalCash: number;
  theoreticalMobileMoney: number;
  transactionCount: number;
};

export async function computeCashClosingDaySummary(
  closingDate: string
): Promise<CashClosingDaySummary> {
  const { start, end } = getClosingDayRange(closingDate);
  const buckets = createEmptyMovementBuckets();

  const [revenues, expenses] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        type: "REVENUE",
        status: { not: "LITIGE_ANNULE" },
        isRecurring: false,
        approvalStatus: { notIn: ["PENDING", "REJECTED"] },
        OR: [{ createdAt: { gte: start, lte: end } }, { updatedAt: { gte: start, lte: end } }],
      },
      select: {
        metadata: true,
        paymentMethod: true,
        paidAmount: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        type: "EXPENSE",
        status: "SOLDE",
        isRecurring: false,
        approvalStatus: { notIn: ["PENDING", "REJECTED"] },
        paymentMethod: { not: null },
        createdAt: { gte: start, lte: end },
      },
      select: {
        paymentMethod: true,
        paidAmount: true,
        createdAt: true,
      },
    }),
  ]);

  for (const revenue of revenues) {
    accumulateRevenueMovements(
      buckets,
      {
        metadata: revenue.metadata,
        paymentMethod: revenue.paymentMethod,
        paidAmount: decimalToNumber(revenue.paidAmount),
        createdAt: revenue.createdAt,
      },
      start,
      end
    );
  }

  for (const expense of expenses) {
    accumulateExpenseMovement(
      buckets,
      {
        paymentMethod: expense.paymentMethod,
        paidAmount: decimalToNumber(expense.paidAmount),
        createdAt: expense.createdAt,
      },
      start,
      end
    );
  }

  return {
    closingDate,
    netCash: roundMoney(buckets.netCash),
    netMobileMoney: roundMoney(buckets.netMobileMoney),
    netBankTransfer: roundMoney(buckets.netBankTransfer),
    netOther: roundMoney(buckets.netOther),
    liquidTransactionCount: buckets.liquidMovementCount,
    otherTransactionCount: buckets.otherMovementCount,
  };
}

export async function computeTheoreticalCashBalances(
  closingDate: string
): Promise<TheoreticalCashBalances> {
  const summary = await computeCashClosingDaySummary(closingDate);

  return {
    ...summary,
    theoreticalCash: summary.netCash,
    theoreticalMobileMoney: summary.netMobileMoney,
    transactionCount: summary.liquidTransactionCount,
  };
}
