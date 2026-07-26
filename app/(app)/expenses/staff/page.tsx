import { ExpensesStaffManagement } from "@/components/organisms/expenses-staff-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

type ExpensesStaffPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function ExpensesStaffPage({ searchParams }: ExpensesStaffPageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_EXPENSE);
  const params = await searchParams;
  const paginationParams = parsePagination(params);

  const where = {
    type: "EXPENSE" as const,
    expenseCategory: "PAIES_CACHETS_STAFF" as const,
    isAdjustment: false,
  };

  const [total, personnelAgg, expenses] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: { totalAmount: true },
    }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: paginationParams.skip,
      take: paginationParams.take,
      select: {
        id: true,
        code: true,
        totalAmount: true,
        currency: true,
        paymentMethod: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  const expenseRows = expenses.map((expense) => ({
    id: expense.id,
    code: expense.code,
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
        title="Paies & cachets staff"
        description="Historique des salaires et cachets versés aux ingénieurs du son et à l'équipe."
      />

      <ExpensesStaffManagement
        initialExpenses={expenseRows}
        pagination={paginationMeta}
        personnelTotal={decimalToNumber(personnelAgg._sum.totalAmount)}
      />
    </div>
  );
}
