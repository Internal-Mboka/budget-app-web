"use client";

import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { StudioOccupancyChart } from "@/components/molecules/studio-occupancy-chart";
import type { StudioOccupancySnapshot } from "@/lib/dashboard/load-studio-occupancy";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodLabel } from "@/lib/dashboard/periods";

type DashboardStudioOccupancyPanelProps = {
  occupancyPeriod: DashboardKpiPeriod;
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod: DashboardKpiPeriod;
  snapshot: StudioOccupancySnapshot;
};

const OCCUPANCY_PERIOD_OPTIONS: DashboardKpiPeriod[] = ["month", "quarter", "year"];

export function DashboardStudioOccupancyPanel({
  occupancyPeriod,
  kpiPeriod,
  granularity,
  categoryPeriod,
  snapshot,
}: DashboardStudioOccupancyPanelProps) {
  return (
    <div className="space-y-4" data-testid="dashboard-studio-occupancy-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <MbokaPeriodSwitch
          label="Période d'occupation"
          testId="dashboard-occupancy-period-switch"
          value={occupancyPeriod}
          options={OCCUPANCY_PERIOD_OPTIONS.map((value) => ({
            value,
            label: getKpiPeriodLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref("/dashboard", {
              kpiPeriod,
              granularity,
              categoryPeriod,
              occupancyPeriod: value,
            })
          }
        />
      </div>

      <MbokaKpiGrid className="sm:grid-cols-3 xl:grid-cols-3">
        <MbokaKpiCard
          label="Taux d'occupation global"
          value={snapshot.occupancyRate}
          hint={`${snapshot.periodLabel} — ${snapshot.soldHours} h vendues`}
          testId="dashboard-occupancy-kpi-rate"
          format="percent"
        />
        <MbokaKpiCard
          label="Heures vendues"
          value={snapshot.soldHours}
          hint="Sessions studio enregistrées"
          testId="dashboard-occupancy-kpi-sold"
          format="hours"
        />
        <MbokaKpiCard
          label="Capacité d'ouverture"
          value={snapshot.capacityHours}
          hint={`${snapshot.periodLabel} — 4 salles × 12 h/jour`}
          testId="dashboard-occupancy-kpi-capacity"
          format="hours"
        />
      </MbokaKpiGrid>

      <StudioOccupancyChart
        data={snapshot.rooms}
        periodLabel={snapshot.periodLabel}
        soldHours={snapshot.soldHours}
        capacityHours={snapshot.capacityHours}
        occupancyRate={snapshot.occupancyRate}
      />
    </div>
  );
}
