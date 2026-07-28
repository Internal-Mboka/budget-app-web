import {
  buildFiscalPeriodBalanceLabel,
  buildFiscalPeriodDocumentCode,
  buildFiscalPeriodKey,
} from "@/lib/period-closure/dates";
import type { FiscalPeriodClosingSnapshot } from "@/lib/fiscal-period/load-fiscal-period-metrics";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import {
  buildPeriodBalanceSnapshotWithHash,
  type PeriodBalanceMetrics,
} from "@/lib/period-closure/load-period-balance";
import { roundMoney } from "@/lib/transactions/decimal";

export function mapFiscalClosingSnapshotToPeriodBalanceMetrics(input: {
  period: FiscalPeriodRecord;
  snapshot: FiscalPeriodClosingSnapshot;
}): PeriodBalanceMetrics {
  const from = input.period.startDate.slice(0, 10);
  const to = input.period.endDate.slice(0, 10);
  const periodKey = buildFiscalPeriodKey(input.period.label);

  return {
    periodKey,
    from,
    to,
    periodLabel: `${input.period.label} · ${buildFiscalPeriodBalanceLabel(from, to)}`,
    documentCode: buildFiscalPeriodDocumentCode(input.period.label),
    revenueTotal: input.snapshot.revenueTotal,
    expenseTotal: input.snapshot.expenseTotal,
    creditTotal: input.snapshot.creditTotal,
    netBalance: roundMoney(
      input.snapshot.revenueTotal - input.snapshot.expenseTotal - input.snapshot.creditTotal
    ),
    paidRevenueTotal: input.snapshot.paidRevenueTotal,
    paidExpenseTotal: input.snapshot.paidExpenseTotal,
    netCashFlow: input.snapshot.netCashFlow,
    revenueCount: input.snapshot.revenueCount,
    expenseCount: input.snapshot.expenseCount,
    creditCount: input.snapshot.creditCount,
  };
}

export function buildFiscalPeriodClosureArchive(input: {
  period: FiscalPeriodRecord;
  snapshot: FiscalPeriodClosingSnapshot;
}) {
  const metrics = mapFiscalClosingSnapshotToPeriodBalanceMetrics(input);
  const snapshotWithHash = buildPeriodBalanceSnapshotWithHash(metrics);

  return {
    metrics,
    snapshotWithHash,
    receivableOutstandingTotal: input.snapshot.receivableOutstandingTotal,
    receivableCount: input.snapshot.receivableCount,
  };
}
