"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, Plus, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/currency";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import type { RecurringExpenseDueItem } from "@/lib/expenses/load-recurring-dues";
import {
  formatRecurringTemplateSummary,
  type RecurringExpenseTemplateItem,
} from "@/lib/expenses/load-recurring-templates";
import { getRecurringPeriodLabel } from "@/lib/expenses/recurring";
import { mbokaButtonPrimaryClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExpensesRecurringManagementProps = {
  templates: RecurringExpenseTemplateItem[];
  dues: RecurringExpenseDueItem[];
  flashCreated?: boolean;
};

function DueDateLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(`${isoDate}T12:00:00`), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || isoDate}</span>;
}

export function ExpensesRecurringManagement({
  templates,
  dues,
  flashCreated,
}: ExpensesRecurringManagementProps) {
  useEffect(() => {
    if (flashCreated) {
      toast.success("Modèle de dépense récurrente enregistré.");
    }
  }, [flashCreated]);

  useEffect(() => {
    if (dues.length > 0) {
      toast.message(
        `${dues.length} échéance${dues.length > 1 ? "s" : ""} récurrente${dues.length > 1 ? "s" : ""} à régler.`,
        { id: "recurring-dues-reminder" }
      );
    }
  }, [dues.length]);

  return (
    <div className="space-y-6">
      <section
        className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
        data-testid="expense-recurring-dues-section"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Échéances à régler</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Échéances pré-générées en attente de validation et de décaissement effectif.
            </p>
          </div>
        </div>

        {dues.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-recurring-dues-empty">
            Aucune échéance en attente.
          </p>
        ) : (
          <div className="space-y-3" data-testid="expense-recurring-dues-list">
            {dues.map((due) => (
              <article
                key={due.id}
                data-testid={`expense-recurring-due-${due.code}`}
                className="rounded-2xl border border-amber-100 bg-white/80 px-3 py-3 dark:border-amber-900 dark:bg-slate-900/50 sm:px-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/expenses/${due.id}`}
                        className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                      >
                        {due.code}
                      </Link>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {due.periodLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {due.metadata?.label ?? "—"} · modèle {due.templateCode}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {formatMoney(due.totalAmount)} · échéance <DueDateLabel isoDate={due.dueDate} />
                    </p>
                  </div>
                  <Link
                    href={`/expenses/${due.id}`}
                    className="text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
                  >
                    Régler →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
        data-testid="expense-recurring-templates-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <Repeat className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
                Modèles récurrents ({templates.length})
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Loyer, abonnements et charges périodiques configurés.
              </p>
            </div>
          </div>

          <Link
            href="/expenses/recurring/new"
            data-testid="expense-recurring-new-link"
            className={cn(mbokaButtonPrimaryClassName, "no-underline")}
          >
            <Plus className="size-4" />
            Nouveau modèle
          </Link>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun modèle récurrent.{" "}
            <Link
              href="/expenses/recurring/new"
              className="font-medium text-[#10579F] hover:underline dark:text-sky-300"
            >
              Configurer la première charge périodique
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3" data-testid="expense-recurring-templates-list">
            {templates.map((template) => (
              <article
                key={template.id}
                data-testid={`expense-recurring-template-${template.code}`}
                className="rounded-2xl border border-violet-100 bg-white/80 px-3 py-3 dark:border-violet-900 dark:bg-slate-900/50 sm:px-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#10579F] dark:text-sky-50">{template.code}</span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                      {getRecurringPeriodLabel(template.recurringPeriod)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {getExpenseCategoryLabel(template.expenseCategory)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRecurringTemplateSummary(template)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Montant estimé {formatMoney(template.totalAmount)}
                    {template.nextDueDate ? (
                      <>
                        {" "}
                        · prochaine échéance <DueDateLabel isoDate={template.nextDueDate} />
                      </>
                    ) : null}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
