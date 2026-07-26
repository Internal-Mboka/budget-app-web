"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/currency";
import type { CashClosingHistoryItem } from "@/lib/cash-closing/load-closings";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingsHistoryTableProps = {
  closings: CashClosingHistoryItem[];
};

function ClosingDateCell({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || "—"}</span>;
}

export function CashClosingsHistoryTable({ closings }: CashClosingsHistoryTableProps) {
  if (closings.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="cash-closings-history-empty">
        Aucune clôture ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className={cn(mbokaPanelClassName, "overflow-hidden")} data-testid="cash-closings-history-table">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/40">
            <tr>
              <th className={cn(mbokaLabelClassName, "px-4 py-3")}>Date</th>
              <th className={cn(mbokaLabelClassName, "px-4 py-3")}>Opérateur</th>
              <th className={cn(mbokaLabelClassName, "px-4 py-3")}>Résultat</th>
              <th className={cn(mbokaLabelClassName, "px-4 py-3")}>Écart</th>
              <th className={cn(mbokaLabelClassName, "px-4 py-3")}>Fiche</th>
            </tr>
          </thead>
          <tbody>
            {closings.map((closing) => (
              <tr
                key={closing.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                data-testid={`cash-closing-history-row-${closing.id}`}
              >
                <td className="px-4 py-3 font-medium text-[#10579F] dark:text-sky-50">
                  <ClosingDateCell isoDate={closing.date} />
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {closing.operator.firstName} {closing.operator.lastName}
                </td>
                <td className="px-4 py-3">
                  {closing.hasDiscrepancy ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <AlertTriangle className="size-3" />
                      Différence
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      Conforme
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {closing.hasDiscrepancy ? formatMoney(closing.gapAmount) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/cash-closing/${closing.id}`}
                    className="font-medium text-[#10579F] hover:underline dark:text-sky-300"
                    data-testid={`cash-closing-history-table-link-${closing.id}`}
                  >
                    Voir →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
