"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/currency";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import {
  getPaymentEntryKindLabel,
  type RevenuePaymentEntry,
} from "@/lib/revenues/payment-history";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

type RevenuePaymentHistoryProps = {
  entries: RevenuePaymentEntry[];
};

function HistoryDate({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy 'à' HH:mm", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || "—"}</span>;
}

export function RevenuePaymentHistory({ entries }: RevenuePaymentHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="revenue-payment-history"
    >
      <div>
        <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Historique des versements</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Suivi chronologique des encaissements enregistrés sur cette transaction.
        </p>
      </div>

      <ol className="space-y-3">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            data-testid={`revenue-payment-entry-${index}`}
            className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 dark:border-sky-900 dark:bg-slate-900/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  {getPaymentEntryKindLabel(entry.kind)} · {formatMoney(entry.amount)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <HistoryDate isoDate={entry.recordedAt} />
                  {entry.recordedBy ? ` · ${entry.recordedBy}` : null}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 dark:text-slate-300">
                <p>Encaissé cumulé : {formatMoney(entry.paidAfter)}</p>
                <p>Reste : {formatMoney(entry.remainingAfter)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Mode : {getPaymentMethodLabel(entry.paymentMethod)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
