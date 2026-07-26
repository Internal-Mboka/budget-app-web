import { notFound } from "next/navigation";

import { ExpenseDetailPanel } from "@/components/organisms/expense-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireSession } from "@/lib/auth/session";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";
import type { ExpenseCategory } from "@prisma/client";

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function ExpenseDetailPage({ params, searchParams }: ExpenseDetailPageProps) {
  await requireSession();
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
    },
  });

  if (!expense || !expense.expenseCategory) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title={expense.code}
        description="Détail de la sortie d'argent enregistrée."
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
        }}
        flash={{ created: query.created === "1" }}
      />
    </div>
  );
}
