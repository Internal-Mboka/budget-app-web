"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Banknote } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  approveExpenseFormAction,
  rejectExpenseFormAction,
  type ExpenseApprovalFormState,
} from "@/lib/actions/expense-approval";
import {
  disburseCashAdvanceFormAction,
  type CashAdvanceFormState,
} from "@/lib/actions/cash-advance";
import { formatMoney } from "@/lib/currency";
import {
  getCashAdvanceWorkflowLabel,
  type CashAdvanceMetadata,
  type CashAdvanceWorkflowStatus,
} from "@/lib/expenses/cash-advance";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@prisma/client";

type ExpenseCashAdvanceSectionProps = {
  transactionId: string;
  cashAdvance: CashAdvanceMetadata;
  workflowStatus: CashAdvanceWorkflowStatus;
  approvalStatus: ApprovalStatus;
  totalAmount: number;
  canApprove: boolean;
  canDisburse: boolean;
  approverName?: string | null;
};

export function ExpenseCashAdvanceSection({
  transactionId,
  cashAdvance,
  workflowStatus,
  approvalStatus,
  totalAmount,
  canApprove,
  canDisburse,
  approverName,
}: ExpenseCashAdvanceSectionProps) {
  const handledApproveRef = useRef<ExpenseApprovalFormState>(null);
  const handledRejectRef = useRef<ExpenseApprovalFormState>(null);
  const handledDisburseRef = useRef<CashAdvanceFormState>(null);
  const [approveState, approveAction] = useActionState(approveExpenseFormAction, null);
  const [rejectState, rejectAction] = useActionState(rejectExpenseFormAction, null);
  const [disburseState, disburseAction] = useActionState(disburseCashAdvanceFormAction, null);

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

  useEffect(() => {
    if (!disburseState || disburseState === handledDisburseRef.current || disburseState.success) {
      return;
    }

    handledDisburseRef.current = disburseState;
    toast.error(disburseState.error);
  }, [disburseState]);

  const pendingApproval = approvalStatus === "PENDING";
  const rejected = approvalStatus === "REJECTED";

  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "space-y-4 p-5 sm:p-6",
        pendingApproval && "border-amber-200 dark:border-amber-900",
        rejected && "border-rose-200 dark:border-rose-900",
        workflowStatus === "JUSTIFIED" && "border-emerald-200 dark:border-emerald-900"
      )}
      data-testid="expense-cash-advance-section"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            workflowStatus === "JUSTIFIED"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : pendingApproval
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                : "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
          )}
        >
          <Banknote className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Avance de caisse / note de frais
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-cash-advance-status">
            {getCashAdvanceWorkflowLabel(workflowStatus)}
            {approverName && workflowStatus !== "SUBMITTED" ? ` — ${approverName}` : null}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Motif : {cashAdvance.purpose}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Montant estimé : {formatMoney(totalAmount)}
          </p>
        </div>
      </div>

      {pendingApproval && canApprove ? (
        <div className="flex flex-wrap gap-3">
          <form action={approveAction} data-testid="expense-cash-advance-approve-form">
            <input type="hidden" name="transactionId" value={transactionId} />
            <MbokaPendingFieldset>
              <MbokaSubmitButton testId="expense-cash-advance-approve" pendingLabel="Approbation...">
                Approuver l&apos;avance
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>

          <form action={rejectAction} data-testid="expense-cash-advance-reject-form">
            <input type="hidden" name="transactionId" value={transactionId} />
            <MbokaPendingFieldset>
              <MbokaSubmitButton
                testId="expense-cash-advance-reject"
                pendingLabel="Refus..."
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
              >
                Refuser
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>
        </div>
      ) : null}

      {pendingApproval && !canApprove ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Demande transmise à la direction pour validation avant décaissement.
        </p>
      ) : null}

      {workflowStatus === "APPROVED" && canDisburse ? (
        <form action={disburseAction} data-testid="expense-cash-advance-disburse-form">
          <input type="hidden" name="transactionId" value={transactionId} />
          <MbokaPendingFieldset>
            <MbokaSubmitButton testId="expense-cash-advance-disburse" pendingLabel="Décaissement...">
              Confirmer le décaissement
            </MbokaSubmitButton>
          </MbokaPendingFieldset>
        </form>
      ) : null}

      {workflowStatus === "APPROVED" && !canDisburse ? (
        <p className="text-sm text-sky-800 dark:text-sky-200">
          Avance approuvée — en attente de décaissement par le service financier.
        </p>
      ) : null}

      {workflowStatus === "DISBURSED" ? (
        <p className="text-sm text-violet-800 dark:text-violet-200">
          Avance décaissée — joignez le reçu d&apos;achat pour clôturer la demande.
        </p>
      ) : null}

      {workflowStatus === "JUSTIFIED" ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" data-testid="expense-cash-advance-justified">
          Demande justifiée — reçu joint et workflow terminé.
        </p>
      ) : null}

      {rejected ? (
        <p className="text-sm text-rose-800 dark:text-rose-200">
          Demande refusée — aucun décaissement autorisé.
        </p>
      ) : null}
    </section>
  );
}
