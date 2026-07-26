"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  confirmRecurringDueFormAction,
  type RecurringExpenseFormState,
} from "@/lib/actions/recurring-expenses";
import { formatMoney } from "@/lib/currency";
import type { RecurringDueMetadata } from "@/lib/expenses/recurring";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExpenseRecurringDueSectionProps = {
  transactionId: string;
  recurringDue: RecurringDueMetadata;
  totalAmount: number;
  isSettled: boolean;
};

export function ExpenseRecurringDueSection({
  transactionId,
  recurringDue,
  totalAmount,
  isSettled,
}: ExpenseRecurringDueSectionProps) {
  const handledRef = useRef<RecurringExpenseFormState>(null);
  const [state, formAction] = useActionState(confirmRecurringDueFormAction, null);

  useEffect(() => {
    if (!state || state === handledRef.current || state.success) {
      return;
    }

    handledRef.current = state;
    toast.error(state.error);
  }, [state]);

  if (isSettled) {
    return (
      <section
        className={cn(mbokaPanelClassName, "space-y-2 p-5 sm:p-6")}
        data-testid="expense-recurring-due-settled"
      >
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Échéance récurrente réglée — période {recurringDue.periodLabel} (modèle {recurringDue.templateCode}).
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 border-amber-200 p-5 dark:border-amber-900 sm:p-6")}
      data-testid="expense-recurring-due-section"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <CalendarClock className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Échéance récurrente</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Période {recurringDue.periodLabel} · modèle {recurringDue.templateCode} ·{" "}
            {formatMoney(totalAmount)}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Confirmez le décaissement effectif une fois le paiement réalisé.
          </p>
        </div>
      </div>

      <form action={formAction} data-testid="expense-recurring-due-form">
        <input type="hidden" name="transactionId" value={transactionId} />
        <MbokaPendingFieldset>
          <MbokaSubmitButton testId="expense-recurring-due-confirm" pendingLabel="Confirmation...">
            Confirmer le décaissement
          </MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
