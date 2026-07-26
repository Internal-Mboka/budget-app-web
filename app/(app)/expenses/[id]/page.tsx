import { notFound } from "next/navigation";

import { ExpenseDetailPanel } from "@/components/organisms/expense-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requireSession } from "@/lib/auth/session";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { loadTransactionAdjustments } from "@/lib/transactions/load-adjustments";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";
import type { ExpenseCategory } from "@prisma/client";

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; adjusted?: string }>;
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
      parentTransactionId: true,
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
  const adjustments = expense.isAdjustment ? [] : await loadTransactionAdjustments(expense.id);

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
          isAdjustment: expense.isAdjustment,
          parentTransaction: expense.parentTransaction,
        }}
        adjustments={adjustments}
        canCreateAdjustment={canCreateAdjustment}
        flash={{ created: query.created === "1", adjusted: query.adjusted === "1" }}
      />
    </div>
  );
}
