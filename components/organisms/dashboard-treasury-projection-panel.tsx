"use client";

import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { TreasuryProjectionChart } from "@/components/molecules/treasury-projection-chart";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { TreasuryProjectionSnapshot } from "@/lib/dashboard/load-treasury-projection";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodLabel } from "@/lib/dashboard/periods";

type DashboardTreasuryProjectionPanelProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  projectionPeriod: DashboardKpiPeriod;
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  snapshot: TreasuryProjectionSnapshot;
};

const PROJECTION_PERIOD_OPTIONS: DashboardKpiPeriod[] = ["month", "quarter", "year"];

export function DashboardTreasuryProjectionPanel({
  basePath,
  projectionPeriod,
  kpiPeriod,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  snapshot,
}: DashboardTreasuryProjectionPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-treasury-projection-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <MbokaPeriodSwitch
          label="Horizon de projection"
          testId="dashboard-projection-period-switch"
          value={projectionPeriod}
          options={PROJECTION_PERIOD_OPTIONS.map((value) => ({
            value,
            label: getKpiPeriodLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref(basePath, {
              kpiPeriod,
              granularity,
              categoryPeriod,
              occupancyPeriod,
              projectionPeriod: value,
            })
          }
        />
      </div>

      <MbokaKpiGrid className="sm:grid-cols-3 xl:grid-cols-3">
        <MbokaKpiCard
          label="Trésorerie actuelle"
          value={snapshot.currentNetTreasury}
          hint="Encaissements − décaissements (global)"
          testId="dashboard-projection-kpi-current"
        />
        <MbokaKpiCard
          label="Encaissements attendus"
          value={snapshot.totalExpectedCollections}
          hint={`${snapshot.horizonLabel} — ${snapshot.reservationCount} réservation${snapshot.reservationCount > 1 ? "s" : ""}`}
          testId="dashboard-projection-kpi-expected"
        />
        <MbokaKpiCard
          label="Trésorerie projetée"
          value={snapshot.projectedTreasuryEnd}
          hint={`Fin de l'horizon (${snapshot.horizonLabel.toLowerCase()})`}
          testId="dashboard-projection-kpi-end"
        />
      </MbokaKpiGrid>

      <TreasuryProjectionChart
        data={snapshot.points}
        horizonLabel={snapshot.horizonLabel}
        currentNetTreasury={snapshot.currentNetTreasury}
      />
    </div>
  );
}
