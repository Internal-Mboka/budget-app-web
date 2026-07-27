import type { FiscalPeriodStatus, Prisma } from "@prisma/client";

import {
  buildDefaultFiscalPeriodLabel,
  computeFiscalPeriodEndDate,
  normalizeFiscalPeriodEndDate,
  normalizeFiscalPeriodStartDate,
} from "@/lib/fiscal-period/dates";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type FiscalPeriodRecord = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  closedAt: string | null;
  openingBalanceCash: number | null;
  openingBalanceMobile: number | null;
  openingBalanceBank: number | null;
  skipOpeningBalance: boolean;
  validatedByPdgId: string | null;
  validatedByAccountantId: string | null;
};

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
  status: FiscalPeriodStatus;
  closedAt: Date | null;
  openingBalanceCash: Prisma.Decimal | null;
  openingBalanceMobile: Prisma.Decimal | null;
  openingBalanceBank: Prisma.Decimal | null;
  skipOpeningBalance: boolean;
  validatedByPdgId: string | null;
  validatedByAccountantId: string | null;
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

export async function loadFiscalPeriodById(id: string): Promise<FiscalPeriodRecord | null> {
  const row = await prisma.fiscalPeriod.findUnique({
    where: { id },
    select: fiscalPeriodSelect,
  });

  return row ? mapFiscalPeriodRow(row) : null;
}

export async function loadOpenFiscalPeriod(): Promise<FiscalPeriodRecord | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: { status: "OPEN" },
    orderBy: [{ startDate: "desc" }],
    select: fiscalPeriodSelect,
  });

  return row ? mapFiscalPeriodRow(row) : null;
}

export async function loadFiscalPeriodContainingDate(date: Date): Promise<FiscalPeriodRecord | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: {
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: [{ startDate: "desc" }],
    select: fiscalPeriodSelect,
  });

  return row ? mapFiscalPeriodRow(row) : null;
}

/** Période opérationnelle courante (OPEN ou CLOSING). */
export async function loadActiveFiscalPeriod(): Promise<FiscalPeriodRecord | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: { status: { in: ["OPEN", "CLOSING"] } },
    orderBy: [{ startDate: "desc" }],
    select: fiscalPeriodSelect,
  });

  return row ? mapFiscalPeriodRow(row) : null;
}

export async function loadFiscalPeriodInClosing(): Promise<FiscalPeriodRecord | null> {
  const row = await prisma.fiscalPeriod.findFirst({
    where: { status: "CLOSING" },
    orderBy: [{ endDate: "desc" }],
    select: fiscalPeriodSelect,
  });

  return row ? mapFiscalPeriodRow(row) : null;
}

export async function hasAnyFiscalPeriod(): Promise<boolean> {
  const count = await prisma.fiscalPeriod.count();
  return count > 0;
}

export async function requiresFiscalPeriodSetup(): Promise<boolean> {
  const openPeriod = await loadOpenFiscalPeriod();
  return openPeriod === null;
}

export type CreateDevOpenFiscalPeriodInput = {
  startDate?: Date;
  label?: string;
  skipOpeningBalance?: boolean;
  openingBalanceCash?: number;
  openingBalanceMobile?: number;
  openingBalanceBank?: number;
};

/** Crée une période OPEN (seed dev / E2E). */
export async function createDevOpenFiscalPeriod(
  input: CreateDevOpenFiscalPeriodInput = {}
): Promise<FiscalPeriodRecord> {
  const startDate = normalizeFiscalPeriodStartDate(input.startDate ?? new Date());
  const endDate = normalizeFiscalPeriodEndDate(computeFiscalPeriodEndDate(startDate));
  const label = input.label ?? buildDefaultFiscalPeriodLabel(startDate);
  const skipOpeningBalance = input.skipOpeningBalance ?? true;

  const row = await prisma.fiscalPeriod.create({
    data: {
      label,
      startDate,
      endDate,
      status: "OPEN",
      skipOpeningBalance,
      openingBalanceCash:
        skipOpeningBalance || input.openingBalanceCash === undefined
          ? null
          : input.openingBalanceCash,
      openingBalanceMobile:
        skipOpeningBalance || input.openingBalanceMobile === undefined
          ? null
          : input.openingBalanceMobile,
      openingBalanceBank:
        skipOpeningBalance || input.openingBalanceBank === undefined
          ? null
          : input.openingBalanceBank,
    },
    select: fiscalPeriodSelect,
  });

  return mapFiscalPeriodRow(row);
}
