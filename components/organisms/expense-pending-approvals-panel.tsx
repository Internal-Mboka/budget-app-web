"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  approveExpenseFormAction,
  type ExpenseApprovalFormState,
} from "@/lib/actions/expense-approval";
import { formatMoney } from "@/lib/currency";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { PendingExpenseApprovalItem } from "@/lib/expenses/load-pending-approvals";
import { getExpenseMetadataSummary } from "@/lib/expenses/metadata";
import { DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD } from "@/lib/expenses/approval";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExpensePendingApprovalsPanelProps = {
  items: PendingExpenseApprovalItem[];
  totalPending: number;
  showQuickApprove?: boolean;
  title?: string;
  description?: string;
  approvalThreshold?: number;
};

function QuickApproveButton({ transactionId }: { transactionId: string }) {
  const handledRef = useRef<ExpenseApprovalFormState>(null);
  const [state, formAction] = useActionState(approveExpenseFormAction, null);

  useEffect(() => {
    if (!state || state === handledRef.current || state.success) {
      return;
    }

    handledRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="transactionId" value={transactionId} />
      <MbokaPendingFieldset>
        <MbokaSubmitButton
          testId={`expense-quick-approve-${transactionId}`}
          pendingLabel="..."
          className="px-3 py-2 text-xs"
        >
          Approuver
        </MbokaSubmitButton>
      </MbokaPendingFieldset>
    </form>
  );
}

export function ExpensePendingApprovalsPanel({
  items,
  totalPending,
  showQuickApprove = true,
  title = "Dépenses en attente d'approbation",
  description,
  approvalThreshold = DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD,
}: ExpensePendingApprovalsPanelProps) {
  const threshold = approvalThreshold;

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="expense-pending-approvals-panel"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description ??
              `${totalPending} dépense${totalPending > 1 ? "s" : ""} au-dessus de ${formatMoney(threshold)} en attente de validation PDG.`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-pending-approvals-empty">
          Aucune dépense en attente pour le moment.
        </p>
      ) : (
        <div className="space-y-3" data-testid="expense-pending-approvals-list">
          {items.map((item) => (
            <article
              key={item.id}
              data-testid={`expense-pending-approval-${item.code}`}
              className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white/80 px-3 py-3 dark:border-amber-900 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/expenses/${item.id}`}
                    className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                  >
                    {item.code}
                  </Link>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    {getExpenseCategoryLabel(item.expenseCategory)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getExpenseMetadataSummary(item.metadata)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {formatMoney(item.totalAmount)} · soumise par {item.createdBy.firstName}{" "}
                  {item.createdBy.lastName}
                </p>
              </div>

              {showQuickApprove ? <QuickApproveButton transactionId={item.id} /> : null}
            </article>
          ))}
        </div>
      )}

      {totalPending > items.length ? (
        <Link
          href="/expenses/approvals"
          className="inline-flex text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
          data-testid="expense-pending-approvals-view-all"
        >
          Voir toutes les demandes ({totalPending})
        </Link>
      ) : null}
    </section>
  );
}
