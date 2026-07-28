import { prisma } from "@/lib/prisma";

import { buildFiscalPeriodClosureArchive } from "./fiscal-period-balance";
import type { FiscalPeriodClosingSnapshot } from "@/lib/fiscal-period/load-fiscal-period-metrics";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";

export async function archiveFiscalPeriodBalanceClosure(input: {
  period: FiscalPeriodRecord;
  snapshot: FiscalPeriodClosingSnapshot;
  closedByUserId: string;
  closedAt?: Date;
}): Promise<{ closureId: string; documentCode: string } | null> {
  const existing = await prisma.financialPeriodClosure.findUnique({
    where: { fiscalPeriodId: input.period.id },
    select: { id: true, documentCode: true },
  });

  if (existing) {
    return { closureId: existing.id, documentCode: existing.documentCode };
  }

  const archive = buildFiscalPeriodClosureArchive({
    period: input.period,
    snapshot: input.snapshot,
  });

  const closedAt = input.closedAt ?? new Date(input.period.closedAt ?? new Date());

  const closure = await prisma.financialPeriodClosure.create({
    data: {
      periodKey: archive.snapshotWithHash.periodKey,
      fiscalPeriodId: input.period.id,
      startDate: new Date(input.period.startDate),
      endDate: new Date(input.period.endDate),
      documentCode: archive.snapshotWithHash.documentCode,
      revenueTotal: archive.snapshotWithHash.revenueTotal,
      expenseTotal: archive.snapshotWithHash.expenseTotal,
      creditTotal: archive.snapshotWithHash.creditTotal,
      netBalance: archive.snapshotWithHash.netBalance,
      paidRevenueTotal: archive.snapshotWithHash.paidRevenueTotal,
      paidExpenseTotal: archive.snapshotWithHash.paidExpenseTotal,
      netCashFlow: archive.snapshotWithHash.netCashFlow,
      revenueCount: archive.snapshotWithHash.revenueCount,
      expenseCount: archive.snapshotWithHash.expenseCount,
      creditCount: archive.snapshotWithHash.creditCount,
      receivableOutstandingTotal: archive.receivableOutstandingTotal,
      receivableCount: archive.receivableCount,
      integrityHash: archive.snapshotWithHash.integrityHash,
      closedAt,
      closedByUserId: input.closedByUserId,
    },
    select: { id: true, documentCode: true },
  });

  return { closureId: closure.id, documentCode: closure.documentCode };
}
