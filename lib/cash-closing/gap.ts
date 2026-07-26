import { roundMoney } from "@/lib/transactions/decimal";

export type CashClosingGapResult = {
  gapAmount: number;
  hasDiscrepancy: boolean;
};

export function computeCashClosingGap(input: {
  theoreticalCash: number;
  theoreticalMobileMoney: number;
  realCash: number;
  realMobileMoney: number;
}): CashClosingGapResult {
  const gapAmount = roundMoney(
    input.realCash +
      input.realMobileMoney -
      (input.theoreticalCash + input.theoreticalMobileMoney)
  );

  return {
    gapAmount,
    hasDiscrepancy: gapAmount !== 0,
  };
}
