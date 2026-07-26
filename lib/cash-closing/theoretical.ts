import { getClosingDayRange } from "@/lib/cash-closing/day-range";
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

function signedAmount(type: "REVENUE" | "EXPENSE", paidAmount: number): number {
  return type === "REVENUE" ? paidAmount : -paidAmount;
}

export async function computeCashClosingDaySummary(
  closingDate: string
): Promise<CashClosingDaySummary> {
  const { start, end } = getClosingDayRange(closingDate);

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "SOLDE",
      isRecurring: false,
      approvalStatus: { notIn: ["PENDING", "REJECTED"] },
      paymentMethod: { not: null },
      createdAt: { gte: start, lte: end },
    },
    select: {
      type: true,
      paymentMethod: true,
      paidAmount: true,
    },
  });

  let netCash = 0;
  let netMobileMoney = 0;
  let netBankTransfer = 0;
  let netOther = 0;
  let liquidTransactionCount = 0;
  let otherTransactionCount = 0;

  for (const transaction of transactions) {
    const amount = signedAmount(transaction.type, decimalToNumber(transaction.paidAmount));

    switch (transaction.paymentMethod) {
      case "CASH":
        netCash += amount;
        liquidTransactionCount += 1;
        break;
      case "MOBILE_MONEY":
        netMobileMoney += amount;
        liquidTransactionCount += 1;
        break;
      case "VIREMENT_BANCAIRE":
        netBankTransfer += amount;
        otherTransactionCount += 1;
        break;
      case "AUTRE":
        netOther += amount;
        otherTransactionCount += 1;
        break;
    }
  }

  return {
    closingDate,
    netCash: roundMoney(netCash),
    netMobileMoney: roundMoney(netMobileMoney),
    netBankTransfer: roundMoney(netBankTransfer),
    netOther: roundMoney(netOther),
    liquidTransactionCount,
    otherTransactionCount,
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
