import { roundMoney } from "@/lib/transactions/decimal";

export type ExpectedClosingBalances = {
  expectedCash: number;
  expectedMobileMoney: number;
  expectedTotal: number;
};

export function computeExpectedClosingBalances(input: {
  openingCash: number;
  openingMobileMoney: number;
  netCash: number;
  netMobileMoney: number;
}): ExpectedClosingBalances {
  const expectedCash = roundMoney(input.openingCash + input.netCash);
  const expectedMobileMoney = roundMoney(input.openingMobileMoney + input.netMobileMoney);

  return {
    expectedCash,
    expectedMobileMoney,
    expectedTotal: roundMoney(expectedCash + expectedMobileMoney),
  };
}

export function describeGapAmount(gapAmount: number): "balanced" | "overage" | "shortage" {
  if (gapAmount === 0) {
    return "balanced";
  }

  return gapAmount > 0 ? "overage" : "shortage";
}
