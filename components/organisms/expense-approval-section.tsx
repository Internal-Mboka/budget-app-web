"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  approveExpenseFormAction,
  rejectExpenseFormAction,
  type ExpenseApprovalFormState,
} from "@/lib/actions/expense-approval";
import { formatMoney } from "@/lib/currency";
import {
  getApprovalStatusLabel,
  isApprovalPending,
  isApprovalRejected,
  DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD,
} from "@/lib/expenses/approval";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@prisma/client";

type ExpenseApprovalSectionProps = {
  transactionId: string;
  approvalStatus: ApprovalStatus;
  totalAmount: number;
  canApprove: boolean;
  approverName?: string | null;
  approvalThreshold?: number;
};

export function ExpenseApprovalSection({
  transactionId,
  approvalStatus,
  totalAmount,
  canApprove,
  approverName,
  approvalThreshold = DEFAULT_EXPENSE_APPROVAL_THRESHOLD_USD,
}: ExpenseApprovalSectionProps) {
  const handledApproveRef = useRef<ExpenseApprovalFormState>(null);
  const handledRejectRef = useRef<ExpenseApprovalFormState>(null);
  const [approveState, approveAction] = useActionState(approveExpenseFormAction, null);
  const [rejectState, rejectAction] = useActionState(rejectExpenseFormAction, null);

  useEffect(() => {
    if (!approveState || approveState === handledApproveRef.current || approveState.success) {
      return;
    }

    handledApproveRef.current = approveState;
    toast.error(approveState.error);
  }, [approveState]);

  useEffect(() => {
    if (!rejectState || rejectState === handledRejectRef.current || rejectState.success) {
      return;
    }

    handledRejectRef.current = rejectState;
    toast.error(rejectState.error);
  }, [rejectState]);

  if (approvalStatus === "NOT_REQUIRED") {
    return null;
  }

  const threshold = approvalThreshold;
  const pending = isApprovalPending(approvalStatus);
  const rejected = isApprovalRejected(approvalStatus);

  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "space-y-4 p-5 sm:p-6",
        pending && "border-amber-200 dark:border-amber-900",
        rejected && "border-rose-200 dark:border-rose-900"
      )}
      data-testid="expense-approval-section"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            pending && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
            !pending && "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          )}
        >
          <ShieldAlert className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Contrôle PDG</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-approval-status">
            {getApprovalStatusLabel(approvalStatus)}
            {approverName ? ` — ${approverName}` : null}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seuil de contrôle : {formatMoney(threshold)} · Montant déclaré : {formatMoney(totalAmount)}
          </p>
        </div>
      </div>

      {pending && canApprove ? (
        <div className="flex flex-wrap gap-3">
          <form action={approveAction} data-testid="expense-approval-approve-form">
            <input type="hidden" name="transactionId" value={transactionId} />
            <MbokaPendingFieldset>
              <MbokaSubmitButton testId="expense-approval-approve" pendingLabel="Approbation...">
                Approuver la dépense
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>

          <form action={rejectAction} data-testid="expense-approval-reject-form">
            <input type="hidden" name="transactionId" value={transactionId} />
            <MbokaPendingFieldset>
              <MbokaSubmitButton
                testId="expense-approval-reject"
                pendingLabel="Refus..."
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
              >
                Refuser
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>
        </div>
      ) : null}

      {pending && !canApprove ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Cette dépense est transmise à la direction pour validation avant prise en compte définitive.
        </p>
      ) : null}
    </section>
  );
}
