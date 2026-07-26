import {
  accumulateExpensePayment,
  accumulateRevenuePayment,
  createEmptyMovementBuckets,
} from "@/lib/cash-closing/movements";
import {
  loadExpensePaymentsForClosingDay,
  loadRevenuePaymentsForClosingDay,
} from "@/lib/cash-closing/load-day-movements";
import { roundMoney } from "@/lib/transactions/decimal";

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
  const buckets = createEmptyMovementBuckets();

  const [revenuePayments, expensePayments] = await Promise.all([
    loadRevenuePaymentsForClosingDay(closingDate),
    loadExpensePaymentsForClosingDay(closingDate),
  ]);

  for (const payment of revenuePayments) {
    accumulateRevenuePayment(buckets, payment);
  }

  for (const expense of expensePayments) {
    accumulateExpenseMovement(
      buckets,
      {
        paymentMethod: expense.paymentMethod,
        paidAmount: expense.amount,
        createdAt: new Date(`${closingDate}T12:00:00`),
      },
      closingDate
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
