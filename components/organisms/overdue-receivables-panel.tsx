"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  sendReceivableReminderFormAction,
  type ReceivableReminderFormState,
} from "@/lib/actions/receivable-reminders";
import { formatMoney } from "@/lib/currency";
import type { OverdueReceivableItem } from "@/lib/dashboard/load-overdue-receivables";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OverdueReceivablesPanelProps = {
  items: OverdueReceivableItem[];
  totalOverdue: number;
  totalAmount: number;
  showQuickActions?: boolean;
  showViewAllLink?: boolean;
  title?: string;
  description?: string;
};

function ReminderButton({
  transactionId,
  disabled,
  disabledReason,
}: {
  transactionId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const handledRef = useRef<ReceivableReminderFormState>(null);
  const [state, formAction] = useActionState(sendReceivableReminderFormAction, null);

  useEffect(() => {
    if (!state || state === handledRef.current) {
      return;
    }

    handledRef.current = state;

    if (state.success) {
      toast.success(state.message);
      return;
    }

    toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} title={disabled ? disabledReason : undefined}>
      <input type="hidden" name="transactionId" value={transactionId} />
      <MbokaPendingFieldset>
        <MbokaSubmitButton
          testId={`receivable-reminder-${transactionId}`}
          pendingLabel="..."
          className="px-3 py-2 text-xs"
          disabled={disabled}
        >
          Rappel
        </MbokaSubmitButton>
      </MbokaPendingFieldset>
    </form>
  );
}

export function OverdueReceivablesPanel({
  items,
  totalOverdue,
  totalAmount,
  showQuickActions = true,
  showViewAllLink = false,
  title = "Créances en souffrance",
  description,
}: OverdueReceivablesPanelProps) {
  const shouldShowViewAll = showViewAllLink ? totalOverdue > 0 : totalOverdue > items.length;

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="overdue-receivables-panel"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description ??
              `${totalOverdue} réservation${totalOverdue > 1 ? "s" : ""} en attente d'acompte dont la date est dépassée — total ${formatMoney(totalAmount)}.`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="overdue-receivables-empty">
          Aucune créance en souffrance pour le moment.
        </p>
      ) : (
        <div className="space-y-3" data-testid="overdue-receivables-list">
          {items.map((item) => {
            const canSendReminder = Boolean(item.client?.email);

            return (
              <article
                key={item.id}
                data-testid={`overdue-receivable-${item.code}`}
                className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-white/80 px-3 py-3 dark:border-rose-900 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/revenues/${item.id}`}
                      className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                    >
                      {item.code}
                    </Link>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      {getRevenueCategoryLabel(item.revenueCategory)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.daysOverdue} j de retard
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.summary}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.client?.name ?? "Client non renseigné"} · échéance {item.dueLabel} · reste{" "}
                    {formatMoney(item.remainingAmount)}
                  </p>
                </div>

                {showQuickActions ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <ReminderButton
                      transactionId={item.id}
                      disabled={!canSendReminder}
                      disabledReason="Ajoutez un e-mail sur la fiche client pour envoyer un rappel."
                    />
                    <Link
                      href={`/revenues/${item.id}`}
                      className="inline-flex rounded-xl border border-sky-100 px-3 py-2 text-xs font-medium text-[#10579F] no-underline transition hover:bg-sky-50 dark:border-sky-900 dark:text-sky-200 dark:hover:bg-slate-800"
                      data-testid={`receivable-payment-${item.id}`}
                    >
                      Encaisser
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {shouldShowViewAll ? (
        <Link
          href="/dashboard/creances"
          className="inline-flex text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
          data-testid="overdue-receivables-view-all"
        >
          Voir toutes les créances ({totalOverdue}) →
        </Link>
      ) : null}
    </section>
  );
}
