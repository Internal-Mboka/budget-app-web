import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

import {
  getFiscalPeriodClosingWorkflowStep,
  type FiscalPeriodClosingWorkflowStep,
} from "./closing-workflow";
import type { FiscalPeriodRecord } from "./load-fiscal-periods";

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
  validatedByAccountant?: { firstName: string; lastName: string } | null;
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

function formatUserName(user: { firstName: string; lastName: string } | null | undefined): string | null {
  if (!user) {
    return null;
  }

  return `${user.firstName} ${user.lastName}`.trim();
}

export type FiscalPeriodClosingQueueItem = FiscalPeriodRecord & {
  validatedByAccountantName: string | null;
  validatedByPdgName: string | null;
  workflowStep: FiscalPeriodClosingWorkflowStep;
};

export async function loadFiscalPeriodClosingQueue(): Promise<FiscalPeriodClosingQueueItem[]> {
  const rows = await prisma.fiscalPeriod.findMany({
    where: { status: "CLOSING" },
    orderBy: [{ endDate: "desc" }],
    select: {
      ...fiscalPeriodSelect,
      validatedByAccountant: { select: { firstName: true, lastName: true } },
      validatedByPdg: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => {
    const period = mapFiscalPeriodRow(row);

    return {
      ...period,
      validatedByAccountantName: formatUserName(row.validatedByAccountant),
      validatedByPdgName: formatUserName(row.validatedByPdg),
      workflowStep: getFiscalPeriodClosingWorkflowStep(period),
    };
  });
}

export async function countFiscalPeriodsInClosing(): Promise<number> {
  return prisma.fiscalPeriod.count({ where: { status: "CLOSING" } });
}

export async function loadFiscalPeriodClosingById(
  periodId: string
): Promise<FiscalPeriodClosingQueueItem | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: { id: periodId, status: "CLOSING" },
    select: {
      ...fiscalPeriodSelect,
      validatedByAccountant: { select: { firstName: true, lastName: true } },
      validatedByPdg: { select: { firstName: true, lastName: true } },
    },
  });

  if (!row) {
    return null;
  }

  const period = mapFiscalPeriodRow(row);

  return {
    ...period,
    validatedByAccountantName: formatUserName(row.validatedByAccountant),
    validatedByPdgName: formatUserName(row.validatedByPdg),
    workflowStep: getFiscalPeriodClosingWorkflowStep(period),
  };
}
