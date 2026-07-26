import { notFound } from "next/navigation";

import { ExpenseDetailPanel } from "@/components/organisms/expense-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requireSession } from "@/lib/auth/session";
import { getExpenseAttachments } from "@/lib/expenses/attachments";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { loadTransactionAdjustments } from "@/lib/transactions/load-adjustments";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";
import type { ExpenseCategory } from "@prisma/client";

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    adjusted?: string;
    attached?: string;
    pendingApproval?: string;
    approved?: string;
    rejected?: string;
    disbursed?: string;
  }>;
};

export default async function ExpenseDetailPage({ params, searchParams }: ExpenseDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const query = await searchParams;

  const expense = await prisma.transaction.findFirst({
    where: { id, type: "EXPENSE" },
    select: {
      id: true,
      code: true,
      expenseCategory: true,
      totalAmount: true,
      currency: true,
      paymentMethod: true,
      metadata: true,
      createdAt: true,
      isAdjustment: true,
      status: true,
      approvalStatus: true,
      parentTransactionId: true,
      approvedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      parentTransaction: {
        select: {
          id: true,
          code: true,
        },
      },
    },
  });

  if (!expense || !expense.expenseCategory) {
    notFound();
  }

  const canCreateAdjustment = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CANCEL_ADJUSTMENT);
  const canUploadAttachment = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const canApproveExpense = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_APPROVE_EXPENSE);
  const adjustments = expense.isAdjustment ? [] : await loadTransactionAdjustments(expense.id);
  const attachments = getExpenseAttachments(expense.metadata);
  const approverName = expense.approvedBy
    ? `${expense.approvedBy.firstName} ${expense.approvedBy.lastName}`
    : null;

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title={expense.code}
        description={
          expense.isAdjustment
            ? "Écriture d'avoir ou de régularisation liée à une dépense d'origine."
            : "Détail de la sortie d'argent enregistrée."
        }
      />

      <ExpenseDetailPanel
        expense={{
          id: expense.id,
          code: expense.code,
          expenseCategory: expense.expenseCategory as ExpenseCategory,
          totalAmount: decimalToNumber(expense.totalAmount),
          currency: expense.currency,
          paymentMethod: expense.paymentMethod,
          metadata: expense.metadata as ExpenseMetadata | null,
          createdAt: expense.createdAt.toISOString(),
          approvalStatus: expense.approvalStatus,
          paymentStatus: expense.status,
          isAdjustment: expense.isAdjustment,
          parentTransaction: expense.parentTransaction,
        }}
        adjustments={adjustments}
        attachments={attachments}
        canCreateAdjustment={canCreateAdjustment}
        canUploadAttachment={canUploadAttachment && !expense.isAdjustment}
        canApproveExpense={canApproveExpense}
        approverName={approverName}
        approvalThreshold={getExpenseApprovalThreshold()}
        flash={{
          created: query.created === "1",
          pendingApproval: query.pendingApproval === "1",
          approved: query.approved === "1",
          rejected: query.rejected === "1",
          disbursed: query.disbursed === "1",
          adjusted: query.adjusted === "1",
          attached: query.attached === "1",
        }}
      />
    </div>
  );
}
