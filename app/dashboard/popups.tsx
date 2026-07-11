"use client";

import { useMemo, useState } from "react";

type DashboardPopupsProps = {
  showHighIncome: boolean;
  showHighExpense: boolean;
  showBudgetDanger: boolean;
  monthlyIncome: number;
  monthlyExpense: number;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function DashboardPopups({
  showHighIncome,
  showHighExpense,
  showBudgetDanger,
  monthlyIncome,
  monthlyExpense,
}: DashboardPopupsProps) {
  const notifications = useMemo(() => {
    const items: Array<{ id: string; title: string; message: string; tone: "green" | "amber" | "red" }> = [];

    if (showHighIncome) {
      items.push({
        id: "high-income",
        title: "Alerte revenu eleve",
        message: `Le revenu du mois est eleve: ${formatMoney(monthlyIncome)} encaisses.`,
        tone: "green",
      });
    }

    if (showHighExpense) {
      items.push({
        id: "high-expense",
        title: "Alerte depense elevee",
        message: `Les depenses du mois atteignent ${formatMoney(monthlyExpense)}.`,
        tone: "amber",
      });
    }

    if (showBudgetDanger) {
      items.push({
        id: "budget-danger",
        title: "Alerte budget critique",
        message: "Le taux de consommation budgetaire est en zone rouge.",
        tone: "red",
      });
    }

    return items;
  }, [monthlyExpense, monthlyIncome, showBudgetDanger, showHighExpense, showHighIncome]);

  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleNotifications = notifications.filter((item) => !dismissed.includes(item.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,26rem)] flex-col gap-3">
      {visibleNotifications.map((item) => {
        const toneClass =
          item.tone === "green"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : item.tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-rose-200 bg-rose-50 text-rose-800";

        return (
          <div key={item.id} className={`rounded-2xl border px-4 py-3 shadow-lg ${toneClass}`} role="status" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setDismissed((current) => [...current, item.id])}
                className="rounded-md border border-current px-2 py-1 text-[11px] font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
