import { roundMoney } from "@/lib/transactions/decimal";

export type CashClosingGapResult = {
  gapCash: number;
  gapMobileMoney: number;
  gapAmount: number;
  hasDiscrepancy: boolean;
};

export function computeCashClosingGap(input: {
  expectedCash: number;
  expectedMobileMoney: number;
  realCash: number;
  realMobileMoney: number;
}): CashClosingGapResult {
  const gapCash = roundMoney(input.realCash - input.expectedCash);
  const gapMobileMoney = roundMoney(input.realMobileMoney - input.expectedMobileMoney);
  const hasDiscrepancy = gapCash !== 0 || gapMobileMoney !== 0;

  return {
    gapCash,
    gapMobileMoney,
    gapAmount: hasDiscrepancy ? roundMoney(Math.abs(gapCash) + Math.abs(gapMobileMoney)) : 0,
    hasDiscrepancy,
  };
}
