import type { RevenueCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import { getRevenueMetadataSummary } from "@/lib/revenues/metadata";
import {
  formatDueLabel,
  getDaysOverdue,
  getRevenueDueDate,
  isRevenueOverdue,
} from "@/lib/revenues/due-date";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type OverdueReceivableItem = {
  id: string;
  code: string;
  revenueCategory: RevenueCategory;
  remainingAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
  dueLabel: string;
  daysOverdue: number;
  summary: string;
  client: {
    id: string;
    name: string;
    email: string | null;
  } | null;
};

function mapOverdueRow(
  row: {
    id: string;
    code: string;
    revenueCategory: RevenueCategory | null;
    remainingAmount: unknown;
    totalAmount: unknown;
    paidAmount: unknown;
    currency: string;
    status: string;
    metadata: unknown;
    createdAt: Date;
    client: { id: string; name: string; email: string | null } | null;
  },
  reference: Date
): OverdueReceivableItem | null {
  if (!row.revenueCategory) {
    return null;
  }

  const dueDate = getRevenueDueDate(row.revenueCategory, row.metadata, row.createdAt);

  if (!isRevenueOverdue(row.status, dueDate, reference)) {
    return null;
  }

  const metadata = row.metadata as RevenueMetadata | null;

  return {
    id: row.id,
    code: row.code,
    revenueCategory: row.revenueCategory,
    remainingAmount: decimalToNumber(row.remainingAmount),
    totalAmount: decimalToNumber(row.totalAmount),
    paidAmount: decimalToNumber(row.paidAmount),
    currency: row.currency,
    dueDate: dueDate.toISOString(),
    dueLabel: formatDueLabel(dueDate),
    daysOverdue: getDaysOverdue(dueDate, reference),
    summary: getRevenueMetadataSummary(row.revenueCategory, metadata),
    client: row.client,
  };
}

function sortOverdueItems(items: OverdueReceivableItem[]): OverdueReceivableItem[] {
  return [...items].sort((left, right) => {
    if (right.remainingAmount !== left.remainingAmount) {
      return right.remainingAmount - left.remainingAmount;
    }

    return right.daysOverdue - left.daysOverdue;
  });
}

const OVERDUE_RECEIVABLE_SELECT = {
  id: true,
  code: true,
  revenueCategory: true,
  remainingAmount: true,
  totalAmount: true,
  paidAmount: true,
  currency: true,
  status: true,
  metadata: true,
  createdAt: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function loadOverdueReceivables(
  limit?: number,
  reference = new Date()
): Promise<OverdueReceivableItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: "RESERVE_ACOMPTE_REQUIS",
      remainingAmount: { gt: 0 },
    },
    select: OVERDUE_RECEIVABLE_SELECT,
  });

  const items = sortOverdueItems(
    rows
      .map((row) => mapOverdueRow(row, reference))
      .filter((item): item is OverdueReceivableItem => Boolean(item))
  );

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export async function countOverdueReceivables(reference = new Date()): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: "RESERVE_ACOMPTE_REQUIS",
      remainingAmount: { gt: 0 },
    },
    select: {
      status: true,
      revenueCategory: true,
      metadata: true,
      createdAt: true,
    },
  });

  return rows.filter((row) => {
    const dueDate = getRevenueDueDate(row.revenueCategory, row.metadata, row.createdAt);
    return isRevenueOverdue(row.status, dueDate, reference);
  }).length;
}

export async function getOverdueReceivablesTotal(reference = new Date()): Promise<number> {
  const items = await loadOverdueReceivables(undefined, reference);

  return items.reduce((sum, item) => sum + item.remainingAmount, 0);
}
