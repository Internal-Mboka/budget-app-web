"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { ExpenseAttachmentsSection } from "@/components/organisms/expense-attachments-section";
import { TransactionAdjustmentsSection } from "@/components/organisms/transaction-adjustments-section";
import { formatMoney } from "@/lib/currency";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import type { ExpenseAttachment } from "@/lib/expenses/attachments";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import type { TransactionAdjustmentRecord } from "@/lib/transactions/adjustments";
import { getNetTransactionAmount } from "@/lib/transactions/adjustments";
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
    isAdjustment?: boolean;
    parentTransaction?: {
      id: string;
      code: string;
    } | null;
  };
  adjustments?: TransactionAdjustmentRecord[];
  attachments?: ExpenseAttachment[];
  canCreateAdjustment?: boolean;
  canUploadAttachment?: boolean;
  flash?: {
    created?: boolean;
    adjusted?: boolean;
    attached?: boolean;
  };
};

export function ExpenseDetailPanel({
  expense,
  adjustments = [],
  attachments = [],
  canCreateAdjustment = false,
  canUploadAttachment = false,
  flash,
}: ExpenseDetailPanelProps) {
  const netAmount = getNetTransactionAmount(expense.totalAmount, adjustments);

  useEffect(() => {
    if (flash?.created) {
      toast.success(`Dépense ${expense.code} enregistrée.`);
    } else if (flash?.adjusted) {
      toast.success("Avoir / régularisation enregistré.");
    } else if (flash?.attached) {
      toast.success("Pièce justificative téléversée.");
    }
  }, [flash?.created, flash?.adjusted, flash?.attached, expense.code]);

  return (
    <div className="space-y-6">
      {expense.isAdjustment && expense.parentTransaction ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
          data-testid="expense-adjustment-banner"
        >
          Écriture de régularisation liée à{" "}
          <Link
            href={`/expenses/${expense.parentTransaction.id}`}
            className="font-semibold underline"
          >
            {expense.parentTransaction.code}
          </Link>
          .
        </div>
      ) : null}

      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="expense-detail-panel">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {getExpenseCategoryLabel(expense.expenseCategory)}
          </span>
          {expense.isAdjustment ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Avoir / régularisation
            </span>
          ) : null}
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
              {formatMoney(expense.isAdjustment ? expense.totalAmount : netAmount)}
            </p>
            {!expense.isAdjustment && adjustments.length > 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Initial {formatMoney(expense.totalAmount)}
              </p>
            ) : null}
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

      {!expense.isAdjustment ? (
        <ExpenseAttachmentsSection
          transactionId={expense.id}
          attachments={attachments}
          canUpload={canUploadAttachment}
        />
      ) : null}

      {!expense.isAdjustment ? (
        <TransactionAdjustmentsSection
          transactionId={expense.id}
          parentCode={expense.code}
          parentTotalAmount={expense.totalAmount}
          detailBasePath="/expenses"
          adjustments={adjustments}
          canCreate={canCreateAdjustment}
        />
      ) : null}
    </div>
  );
}
