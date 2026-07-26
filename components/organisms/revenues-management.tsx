"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { formatMoney } from "@/lib/currency";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import { getRevenueMetadataSummary } from "@/lib/revenues/metadata";
import { buildRevenuesListHref } from "@/lib/revenues/list-url";
import type { PaginationMeta } from "@/lib/pagination";
import {
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";
import { cn } from "@/lib/utils";
import type { RevenueCategory } from "@prisma/client";

export type RevenueListItem = {
  id: string;
  code: string;
  revenueCategory: RevenueCategory;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: string;
  metadata: RevenueMetadata | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  } | null;
};

type RevenuesManagementProps = {
  initialRevenues: RevenueListItem[];
  pagination: PaginationMeta;
};

function RevenueDate({ isoDate }: { isoDate: string }) {
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

function statusBadgeClass(status: string) {
  switch (status) {
    case "SOLDE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "LITIGE_ANNULE":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
    case "EN_COURS_REALISE":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function RevenuesManagement({ initialRevenues, pagination }: RevenuesManagementProps) {
  return (
    <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Revenus enregistrés ({pagination.total})
        </h2>

        <Link
          href="/revenues/new"
          data-testid="revenue-new-link"
          className={cn(mbokaButtonPrimaryClassName, "no-underline")}
        >
          <Plus className="size-4" />
          Nouveau revenu
        </Link>
      </div>

      {initialRevenues.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aucun revenu pour le moment.{" "}
          <Link href="/revenues/new" className="font-medium text-[#10579F] hover:underline dark:text-sky-300">
            Enregistrez le premier revenu
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {initialRevenues.map((revenue) => (
            <article
              key={revenue.id}
              data-testid={`revenue-row-${revenue.code}`}
              className="rounded-2xl border border-sky-100 bg-white/80 px-3 py-3 dark:border-sky-900 dark:bg-slate-900/50 sm:px-4 sm:py-3.5"
            >
              <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] sm:size-11 dark:bg-slate-800 dark:text-sky-50">
                  <Receipt className="size-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">{revenue.code}</h3>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-[#10579F] dark:bg-sky-950/40 dark:text-sky-300">
                      {getRevenueCategoryLabel(revenue.revenueCategory)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        statusBadgeClass(revenue.status)
                      )}
                    >
                      {getPaymentStatusLabel(revenue.status)}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {revenue.client ? (
                      <Link
                        href={`/clients/${revenue.client.id}`}
                        className="font-medium text-[#10579F] hover:underline dark:text-sky-300"
                      >
                        {revenue.client.name}
                      </Link>
                    ) : (
                      "Client non renseigné"
                    )}
                    {" · "}
                    {getRevenueMetadataSummary(revenue.revenueCategory, revenue.metadata)}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span>Total {formatMoney(revenue.totalAmount)}</span>
                    <span>Acompte {formatMoney(revenue.paidAmount)}</span>
                    <span>Reste {formatMoney(revenue.remainingAmount)}</span>
                    <RevenueDate isoDate={revenue.createdAt} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <MbokaPagination
        meta={pagination}
        buildHref={(page, pageSize) => buildRevenuesListHref({ page, pageSize: pageSize ?? pagination.pageSize })}
      />
    </section>
  );
}
