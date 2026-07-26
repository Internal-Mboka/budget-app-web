import type { PaymentStatus, TransactionType } from "@prisma/client";

type ClientTransactionRow = {
  type: TransactionType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
};

export function computeClientStats(transactions: ClientTransactionRow[]) {
  const revenueTransactions = transactions.filter((item) => item.type === "REVENUE");

  const totalSpent = revenueTransactions.reduce((sum, item) => sum + item.paidAmount, 0);

  const balanceDue = revenueTransactions
    .filter((item) => item.status !== "SOLDE" && item.status !== "LITIGE_ANNULE")
    .reduce((sum, item) => sum + item.remainingAmount, 0);

  const transactionCount = transactions.length;

  return {
    totalSpent,
    balanceDue,
    transactionCount,
  };
}

export function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}
