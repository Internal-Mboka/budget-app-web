"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { ExpenseApprovalSection } from "@/components/organisms/expense-approval-section";
import { ExpenseStaffPayrollSection } from "@/components/organisms/expense-staff-payroll-section";
import { ExpenseAttachmentsSection } from "@/components/organisms/expense-attachments-section";
import { TransactionAdjustmentsSection } from "@/components/organisms/transaction-adjustments-section";
import { formatMoney } from "@/lib/currency";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import type { ExpenseAttachment } from "@/lib/expenses/attachments";
import { parseStaffPayrollMetadata } from "@/lib/expenses/staff-payroll";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import type { TransactionAdjustmentRecord } from "@/lib/transactions/adjustments";
import { getNetTransactionAmount } from "@/lib/transactions/adjustments";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";
import type { ApprovalStatus, ExpenseCategory } from "@prisma/client";
import { getApprovalStatusLabel, isApprovalPending } from "@/lib/expenses/approval";

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
    approvalStatus?: ApprovalStatus;
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
  canApproveExpense?: boolean;
  approverName?: string | null;
  approvalThreshold?: number;
  flash?: {
    created?: boolean;
    adjusted?: boolean;
    attached?: boolean;
    pendingApproval?: boolean;
    approved?: boolean;
    rejected?: boolean;
  };
};

export function ExpenseDetailPanel({
  expense,
  adjustments = [],
  attachments = [],
  canCreateAdjustment = false,
  canUploadAttachment = false,
  canApproveExpense = false,
  approverName,
  approvalThreshold,
  flash,
}: ExpenseDetailPanelProps) {
  const netAmount = getNetTransactionAmount(expense.totalAmount, adjustments);
  const staffPayroll = parseStaffPayrollMetadata(expense.metadata);

  useEffect(() => {
    if (flash?.created && flash?.pendingApproval) {
      toast.message(`Dépense ${expense.code} enregistrée — en attente d'approbation PDG.`);
    } else if (flash?.created) {
      toast.success(`Dépense ${expense.code} enregistrée.`);
    } else if (flash?.approved) {
      toast.success("Dépense approuvée.");
    } else if (flash?.rejected) {
      toast.message("Dépense refusée par la direction.");
    } else if (flash?.adjusted) {
      toast.success("Avoir / régularisation enregistré.");
    } else if (flash?.attached) {
      toast.success("Pièce justificative téléversée.");
    }
  }, [
    flash?.created,
    flash?.pendingApproval,
    flash?.approved,
    flash?.rejected,
    flash?.adjusted,
    flash?.attached,
    expense.code,
  ]);

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
          {expense.approvalStatus && expense.approvalStatus !== "NOT_REQUIRED" ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                isApprovalPending(expense.approvalStatus)
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : expense.approvalStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
              )}
              data-testid="expense-detail-approval-badge"
            >
              {getApprovalStatusLabel(expense.approvalStatus)}
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

      {staffPayroll ? <ExpenseStaffPayrollSection staffPayroll={staffPayroll} /> : null}

      {!expense.isAdjustment && expense.approvalStatus ? (
        <ExpenseApprovalSection
          transactionId={expense.id}
          approvalStatus={expense.approvalStatus}
          totalAmount={expense.totalAmount}
          canApprove={canApproveExpense}
          approverName={approverName}
          approvalThreshold={approvalThreshold}
        />
      ) : null}

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
