"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { formatMoney } from "@/lib/currency";
import { buildExpensesStaffListHref } from "@/lib/expenses/staff-list-url";
import type { ExpenseMetadata } from "@/lib/expenses/metadata";
import { getExpenseMetadataSummary } from "@/lib/expenses/metadata";
import {
  getStaffPaymentTypeLabel,
  parseStaffPayrollMetadata,
} from "@/lib/expenses/staff-payroll";
import type { PaginationMeta } from "@/lib/pagination";
import {
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

export type StaffExpenseListItem = {
  id: string;
  code: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string | null;
  metadata: ExpenseMetadata | null;
  createdAt: string;
};

type ExpensesStaffManagementProps = {
  initialExpenses: StaffExpenseListItem[];
  pagination: PaginationMeta;
  personnelTotal: number;
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

export function ExpensesStaffManagement({
  initialExpenses,
  pagination,
  personnelTotal,
}: ExpensesStaffManagementProps) {
  return (
    <div className="space-y-6">
      <section
        className={cn(mbokaPanelClassName, "grid gap-4 p-5 sm:grid-cols-2 sm:p-6")}
        data-testid="expenses-staff-summary"
      >
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-4 dark:border-violet-900 dark:bg-violet-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-600">Charges de personnel</p>
          <p className="mt-1 text-2xl font-semibold text-[#10579F] dark:text-sky-50" data-testid="expenses-staff-total">
            {formatMoney(personnelTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total des paies et cachets enregistrés ({pagination.total} écriture{pagination.total > 1 ? "s" : ""})
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Link
            href="/expenses/new?category=PAIES_CACHETS_STAFF"
            data-testid="expense-staff-new-link"
            className={cn(mbokaButtonPrimaryClassName, "no-underline")}
          >
            <Plus className="size-4" />
            Nouvelle paie / cachet
          </Link>
        </div>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        {initialExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucune rémunération staff enregistrée.{" "}
            <Link
              href="/expenses/new?category=PAIES_CACHETS_STAFF"
              className="font-medium text-[#10579F] hover:underline dark:text-sky-300"
            >
              Enregistrer la première paie ou cachet
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3" data-testid="expenses-staff-list">
            {initialExpenses.map((expense) => {
              const staffPayroll = parseStaffPayrollMetadata(expense.metadata);

              return (
                <article
                  key={expense.id}
                  data-testid={`expense-staff-row-${expense.code}`}
                  className="rounded-2xl border border-violet-100 bg-white/80 px-3 py-3 dark:border-violet-900 dark:bg-slate-900/50 sm:px-4 sm:py-3.5"
                >
                  <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 sm:size-11 dark:bg-violet-950/30 dark:text-violet-300">
                      <Users className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                        >
                          {expense.code}
                        </Link>
                        {staffPayroll ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                            {getStaffPaymentTypeLabel(staffPayroll.paymentType)}
                          </span>
                        ) : null}
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
              );
            })}
          </div>
        )}

        <MbokaPagination
          meta={pagination}
          buildHref={(page, pageSize) =>
            buildExpensesStaffListHref({ page, pageSize: pageSize ?? pagination.pageSize })
          }
        />
      </section>
    </div>
  );
}
