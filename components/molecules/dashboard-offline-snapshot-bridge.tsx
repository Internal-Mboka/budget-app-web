"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/currency";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import {
  formatOfflineSnapshotAge,
  loadDashboardOfflineSnapshot,
  saveDashboardOfflineSnapshot,
  type DashboardOfflineSnapshot,
} from "@/lib/pwa/offline-snapshot";
import { useNetworkStatus } from "@/lib/pwa/use-network-status";
import { cn } from "@/lib/utils";

type DashboardOfflineSnapshotBridgeProps = {
  path: string;
  periodLabel: string;
  kpis: DashboardOfflineSnapshot["kpis"];
  overdueCount: number;
  fiscalPeriodLabel: string | null;
};

export function DashboardOfflineSnapshotBridge(props: DashboardOfflineSnapshotBridgeProps) {
  const networkStatus = useNetworkStatus();
  const [cachedSnapshot, setCachedSnapshot] = useState<DashboardOfflineSnapshot | null>(null);

  useEffect(() => {
    if (networkStatus === "offline") {
      setCachedSnapshot(loadDashboardOfflineSnapshot());
      return;
    }

    const snapshot: DashboardOfflineSnapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      path: props.path,
      periodLabel: props.periodLabel,
      kpis: props.kpis,
      overdueCount: props.overdueCount,
      fiscalPeriodLabel: props.fiscalPeriodLabel,
    };

    saveDashboardOfflineSnapshot(snapshot);
    setCachedSnapshot(snapshot);
  }, [
    networkStatus,
    props.path,
    props.periodLabel,
    props.overdueCount,
    props.fiscalPeriodLabel,
    props.kpis.revenueTotal,
    props.kpis.expenseTotal,
    props.kpis.netTreasury,
    props.kpis.receivables,
    props.kpis.cashCollections,
  ]);

  if (networkStatus !== "offline" || !cachedSnapshot) {
    return null;
  }

  const savedLabel = format(new Date(cachedSnapshot.savedAt), "d MMM yyyy · HH:mm", { locale: fr });

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 border-amber-200 bg-amber-50/70 p-4 sm:p-5 dark:border-amber-900 dark:bg-amber-950/20")}
      data-testid="dashboard-offline-snapshot-notice"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <History className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            Données mises en cache — lecture seule
          </h2>
          <p className="text-sm leading-6 text-amber-900/90 dark:text-amber-100/90">
            Dernière synchronisation {formatOfflineSnapshotAge(cachedSnapshot.savedAt)} ({savedLabel}
            ). Les chiffres ci-dessous peuvent différer du serveur tant que la connexion n&apos;est pas
            rétablie.
          </p>
        </div>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <SnapshotMetric label="Période" value={cachedSnapshot.periodLabel} />
        <SnapshotMetric label="Revenus" value={formatMoney(cachedSnapshot.kpis.revenueTotal)} />
        <SnapshotMetric label="Dépenses" value={formatMoney(cachedSnapshot.kpis.expenseTotal)} />
        <SnapshotMetric label="Trésorerie nette" value={formatMoney(cachedSnapshot.kpis.netTreasury)} />
        <SnapshotMetric label="Créances" value={formatMoney(cachedSnapshot.kpis.receivables)} />
        <SnapshotMetric
          label="Créances en souffrance"
          value={`${cachedSnapshot.overdueCount} créance${cachedSnapshot.overdueCount > 1 ? "s" : ""}`}
        />
      </dl>

      {cachedSnapshot.fiscalPeriodLabel ? (
        <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
          Trimestre comptable : {cachedSnapshot.fiscalPeriodLabel}
        </p>
      ) : null}
    </section>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white/70 px-3 py-2.5 dark:border-amber-900/60 dark:bg-slate-900/40">
      <dt className="text-[11px] font-medium tracking-wide text-amber-700/80 uppercase dark:text-amber-300/80">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-amber-950 dark:text-amber-50">{value}</dd>
    </div>
  );
}
