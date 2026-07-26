"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/currency";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@prisma/client";

type ExpenseDetailPanelProps = {
  expense: {
    id: string;
    code: string;
    expenseCategory: ExpenseCategory;
    totalAmount: number;
    currency: string;
    paymentMethod: string | null;
    metadata: ExpenseMetadata | null;
    createdAt: string;
  };
  flash?: {
    created?: boolean;
  };
};

export function ExpenseDetailPanel({ expense, flash }: ExpenseDetailPanelProps) {
  useEffect(() => {
    if (flash?.created) {
      toast.success(`Dépense ${expense.code} enregistrée.`);
    }
  }, [flash?.created, expense.code]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="expense-detail-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {getExpenseCategoryLabel(expense.expenseCategory)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={mbokaLabelClassName}>Libellé</p>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100" data-testid="expense-detail-label">
            {expense.metadata?.label ?? "—"}
          </p>
        </div>

        <div>
          <p className={mbokaLabelClassName}>Montant</p>
          <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="expense-detail-total">
            {formatMoney(expense.totalAmount)}
          </p>
        </div>

        <div>
          <p className={mbokaLabelClassName}>Mode de paiement</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200" data-testid="expense-detail-payment-method">
            {getPaymentMethodLabel(expense.paymentMethod)}
          </p>
        </div>

        <div>
          <p className={mbokaLabelClassName}>Devise</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{expense.currency}</p>
        </div>
      </div>

      {expense.metadata?.notes ? (
        <div>
          <p className={mbokaLabelClassName}>Notes internes</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{expense.metadata.notes}</p>
        </div>
      ) : null}
    </section>
  );
}
