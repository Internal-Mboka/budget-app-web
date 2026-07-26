import { roundMoney } from "@/lib/transactions/decimal";

export type CashClosingGapResult = {
  gapAmount: number;
  hasDiscrepancy: boolean;
};

export function computeCashClosingGap(input: {
  expectedCash: number;
  expectedMobileMoney: number;
  realCash: number;
  realMobileMoney: number;
}): CashClosingGapResult {
  const gapAmount = roundMoney(
    input.realCash +
      input.realMobileMoney -
      (input.expectedCash + input.expectedMobileMoney)
  );

  return {
    gapAmount,
    hasDiscrepancy: gapAmount !== 0,
  };
}
