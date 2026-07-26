import { getClosingDayRange } from "@/lib/cash-closing/day-range";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type TheoreticalCashBalances = {
  theoreticalCash: number;
  theoreticalMobileMoney: number;
  transactionCount: number;
  closingDate: string;
};

export async function computeTheoreticalCashBalances(
  closingDate: string
): Promise<TheoreticalCashBalances> {
  const { start, end } = getClosingDayRange(closingDate);

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "SOLDE",
      isRecurring: false,
      approvalStatus: { notIn: ["PENDING", "REJECTED"] },
      paymentMethod: { in: ["CASH", "MOBILE_MONEY"] },
      createdAt: { gte: start, lte: end },
    },
    select: {
      type: true,
      paymentMethod: true,
      paidAmount: true,
    },
  });

  let theoreticalCash = 0;
  let theoreticalMobileMoney = 0;

  for (const transaction of transactions) {
    const amount = decimalToNumber(transaction.paidAmount);
    const signed = transaction.type === "REVENUE" ? amount : -amount;

    if (transaction.paymentMethod === "CASH") {
      theoreticalCash += signed;
    } else if (transaction.paymentMethod === "MOBILE_MONEY") {
      theoreticalMobileMoney += signed;
    }
  }

  return {
    closingDate,
    theoreticalCash: roundMoney(theoreticalCash),
    theoreticalMobileMoney: roundMoney(theoreticalMobileMoney),
    transactionCount: transactions.length,
  };
}
