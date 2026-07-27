import { createHash } from "node:crypto";

export type PeriodBalanceSnapshot = {
  periodKey: string;
  from: string;
  to: string;
  documentCode: string;
  revenueTotal: number;
  expenseTotal: number;
  creditTotal: number;
  netBalance: number;
  paidRevenueTotal: number;
  paidExpenseTotal: number;
  netCashFlow: number;
  revenueCount: number;
  expenseCount: number;
  creditCount: number;
};

function canonicalizeSnapshot(snapshot: PeriodBalanceSnapshot): string {
  return JSON.stringify({
    creditCount: snapshot.creditCount,
    creditTotal: snapshot.creditTotal.toFixed(2),
    documentCode: snapshot.documentCode,
    expenseCount: snapshot.expenseCount,
    expenseTotal: snapshot.expenseTotal.toFixed(2),
    from: snapshot.from,
    netBalance: snapshot.netBalance.toFixed(2),
    netCashFlow: snapshot.netCashFlow.toFixed(2),
    paidExpenseTotal: snapshot.paidExpenseTotal.toFixed(2),
    paidRevenueTotal: snapshot.paidRevenueTotal.toFixed(2),
    periodKey: snapshot.periodKey,
    revenueCount: snapshot.revenueCount,
    revenueTotal: snapshot.revenueTotal.toFixed(2),
    to: snapshot.to,
  });
}

export function computePeriodBalanceIntegrityHash(snapshot: PeriodBalanceSnapshot): string {
  return createHash("sha256").update(canonicalizeSnapshot(snapshot)).digest("hex");
}

export function formatIntegrityHashForDisplay(hash: string): string {
  return hash.toUpperCase().match(/.{1,4}/g)?.join("-") ?? hash.toUpperCase();
}
