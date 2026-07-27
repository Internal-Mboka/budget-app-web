import {
  loadFiscalPeriodClosingSnapshot,
  type FiscalPeriodClosingSnapshot,
} from "@/lib/fiscal-period/load-fiscal-period-metrics";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

const fiscalPeriodSelect = {
  id: true,
  label: true,
  startDate: true,
  endDate: true,
  status: true,
  closedAt: true,
  openingBalanceCash: true,
  openingBalanceMobile: true,
  openingBalanceBank: true,
  skipOpeningBalance: true,
  validatedByPdgId: true,
  validatedByAccountantId: true,
} as const;

function mapFiscalPeriodRow(row: {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodRecord["status"];
  closedAt: Date | null;
  openingBalanceCash: { toString(): string } | null;
  openingBalanceMobile: { toString(): string } | null;
  openingBalanceBank: { toString(): string } | null;
  skipOpeningBalance: boolean;
  validatedByPdgId: string | null;
  validatedByAccountantId: string | null;
  validatedByPdg?: { firstName: string; lastName: string } | null;
}): FiscalPeriodRecord {
  return {
    id: row.id,
    label: row.label,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status,
    closedAt: row.closedAt?.toISOString() ?? null,
    openingBalanceCash:
      row.openingBalanceCash === null ? null : roundMoney(decimalToNumber(row.openingBalanceCash)),
    openingBalanceMobile:
      row.openingBalanceMobile === null ? null : roundMoney(decimalToNumber(row.openingBalanceMobile)),
    openingBalanceBank:
      row.openingBalanceBank === null ? null : roundMoney(decimalToNumber(row.openingBalanceBank)),
    skipOpeningBalance: row.skipOpeningBalance,
    validatedByPdgId: row.validatedByPdgId,
    validatedByAccountantId: row.validatedByAccountantId,
  };
}

export type FiscalPeriodClosingRecap = {
  period: FiscalPeriodRecord;
  snapshot: FiscalPeriodClosingSnapshot;
  validatedByPdgName: string | null;
};

export async function loadFiscalPeriodClosingRecaps(limit = 3): Promise<FiscalPeriodClosingRecap[]> {
  const rows = await prisma.fiscalPeriod.findMany({
    where: { status: "CLOSED" },
    orderBy: [{ closedAt: "desc" }],
    take: limit,
    select: {
      ...fiscalPeriodSelect,
      validatedByPdg: { select: { firstName: true, lastName: true } },
    },
  });

  const recaps: FiscalPeriodClosingRecap[] = [];

  for (const row of rows) {
    const period = mapFiscalPeriodRow(row);
    const snapshot = await loadFiscalPeriodClosingSnapshot(period);
    const validatedByPdgName = row.validatedByPdg
      ? `${row.validatedByPdg.firstName} ${row.validatedByPdg.lastName}`.trim()
      : null;

    recaps.push({ period, snapshot, validatedByPdgName });
  }

  return recaps;
}

export async function loadFiscalPeriodClosingRecapById(
  periodId: string
): Promise<FiscalPeriodClosingRecap | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: { id: periodId, status: "CLOSED" },
    select: {
      ...fiscalPeriodSelect,
      validatedByPdg: { select: { firstName: true, lastName: true } },
    },
  });

  if (!row) {
    return null;
  }

  const period = mapFiscalPeriodRow(row);
  const snapshot = await loadFiscalPeriodClosingSnapshot(period);

  return {
    period,
    snapshot,
    validatedByPdgName: row.validatedByPdg
      ? `${row.validatedByPdg.firstName} ${row.validatedByPdg.lastName}`.trim()
      : null,
  };
}
