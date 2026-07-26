"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { formatMoney } from "@/lib/currency";
import { buildExpensesListHref } from "@/lib/expenses/list-url";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { getExpenseMetadataSummary } from "@/lib/expenses/metadata";
import type { PaginationMeta } from "@/lib/pagination";
import {
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@prisma/client";

export type ExpenseListItem = {
  id: string;
  code: string;
  expenseCategory: ExpenseCategory;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  metadata: ExpenseMetadata | null;
  createdAt: string;
};

type ExpensesManagementProps = {
  initialExpenses: ExpenseListItem[];
  pagination: PaginationMeta;
};

function ExpenseDate({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return (
    <p className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
      {label || "—"}
    </p>
  );
}

export function ExpensesManagement({ initialExpenses, pagination }: ExpensesManagementProps) {
  return (
    <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Dépenses enregistrées ({pagination.total})
        </h2>

        <Link
          href="/expenses/new"
          data-testid="expense-new-link"
          className={cn(mbokaButtonPrimaryClassName, "no-underline")}
        >
          <Plus className="size-4" />
          Nouvelle dépense
        </Link>
      </div>

      {initialExpenses.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aucune dépense pour le moment.{" "}
          <Link href="/expenses/new" className="font-medium text-[#10579F] hover:underline dark:text-sky-300">
            Enregistrez la première dépense
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {initialExpenses.map((expense) => (
            <article
              key={expense.id}
              data-testid={`expense-row-${expense.code}`}
              className="rounded-2xl border border-sky-100 bg-white/80 px-3 py-3 dark:border-sky-900 dark:bg-slate-900/50 sm:px-4 sm:py-3.5"
            >
              <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 sm:size-11 dark:bg-rose-950/30 dark:text-rose-300">
                  <Wallet className="size-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                      data-testid={`expense-link-${expense.code}`}
                    >
                      {expense.code}
                    </Link>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      {getExpenseCategoryLabel(expense.expenseCategory)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {getExpenseMetadataSummary(expense.metadata)}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span>Montant {formatMoney(expense.totalAmount)}</span>
                    <span>{getPaymentMethodLabel(expense.paymentMethod)}</span>
                    <ExpenseDate isoDate={expense.createdAt} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <MbokaPagination
        meta={pagination}
        buildHref={(page, pageSize) => buildExpensesListHref({ page, pageSize: pageSize ?? pagination.pageSize })}
      />
    </section>
  );
}
