import { ExpensesManagement } from "@/components/organisms/expenses-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { ExpenseCategory } from "@prisma/client";

type ExpensesPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const params = await searchParams;
  const paginationParams = parsePagination(params);

  const where = { type: "EXPENSE" as const };

  const [total, expenses] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: paginationParams.skip,
      take: paginationParams.take,
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
    }),
  ]);

  const expenseRows = expenses
    .filter((expense) => expense.expenseCategory)
    .map((expense) => ({
      id: expense.id,
      code: expense.code,
      expenseCategory: expense.expenseCategory as ExpenseCategory,
      totalAmount: decimalToNumber(expense.totalAmount),
      currency: expense.currency,
      paymentMethod: expense.paymentMethod,
      metadata: expense.metadata as ExpenseMetadata | null,
      createdAt: expense.createdAt.toISOString(),
    }));

  const paginationMeta = buildPaginationMeta(total, paginationParams.page, paginationParams.pageSize);

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Registre des dépenses"
        description="Sorties d'argent classées par catégorie : matériel, charges, paies et investissements."
      />

      <ExpensesManagement initialExpenses={expenseRows} pagination={paginationMeta} />
    </div>
  );
}
