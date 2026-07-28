import type { ApprovalStatus, ExpenseCategory } from "@prisma/client";

import {
  parseCashAdvanceMetadata,
  resolveCashAdvanceWorkflowStatus,
  type CashAdvanceWorkflowStatus,
} from "@/lib/expenses/cash-advance";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type CashAdvanceRequestItem = {
  id: string;
  code: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  metadata: ExpenseMetadata | null;
  approvalStatus: ApprovalStatus;
  paymentStatus: string;
  workflowStatus: CashAdvanceWorkflowStatus;
  purpose: string;
  createdAt: string;
};

export async function loadCashAdvanceRequests(limit = 50): Promise<CashAdvanceRequestItem[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      expenseCategory: "AVANCE_CAISSE_NOTE_FRAIS",
      isAdjustment: false,
      isRecurring: false,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      metadata: true,
      approvalStatus: true,
      status: true,
      createdAt: true,
    },
  });

  return rows.map((row) => {
    const cashAdvance = parseCashAdvanceMetadata(row.metadata);
    const workflowStatus = resolveCashAdvanceWorkflowStatus({
      cashAdvance,
      approvalStatus: row.approvalStatus,
      paymentStatus: row.status,
    });

    return {
      id: row.id,
      code: row.code,
      totalAmount: decimalToNumber(row.totalAmount),
      currency: row.currency,
      paymentMethod: row.paymentMethod,
      metadata: row.metadata as ExpenseMetadata | null,
      approvalStatus: row.approvalStatus,
      paymentStatus: row.status,
      workflowStatus,
      purpose: cashAdvance?.purpose ?? (row.metadata as ExpenseMetadata | null)?.label ?? "—",
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function countPendingCashAdvanceApprovals(): Promise<number> {
  return prisma.transaction.count({
    where: {
      type: "EXPENSE",
      expenseCategory: "AVANCE_CAISSE_NOTE_FRAIS",
      isAdjustment: false,
      isRecurring: false,
      approvalStatus: "PENDING",
    },
  });
}

export async function countCashAdvancesAwaitingJustification(): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      expenseCategory: "AVANCE_CAISSE_NOTE_FRAIS",
      isAdjustment: false,
      isRecurring: false,
      status: "SOLDE",
    },
    select: { metadata: true, approvalStatus: true, status: true },
  });

  return rows.filter((row) => {
    const cashAdvance = parseCashAdvanceMetadata(row.metadata);
    const workflowStatus = resolveCashAdvanceWorkflowStatus({
      cashAdvance,
      approvalStatus: row.approvalStatus,
      paymentStatus: row.status,
    });

    return workflowStatus === "DISBURSED";
  }).length;
}
