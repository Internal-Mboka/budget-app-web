"use client";

import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import { MbokaPeriodSwitch } from "@/components/molecules/mboka-period-switch";
import { TreasuryProjectionChart } from "@/components/molecules/treasury-projection-chart";
import { buildFinancialDashboardHref } from "@/lib/dashboard/list-url";
import type { TreasuryProjectionSnapshot } from "@/lib/dashboard/load-treasury-projection";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import { getKpiPeriodLabel } from "@/lib/dashboard/periods";
import {
  getProjectionScenarioHint,
  getProjectionScenarioLabel,
  type TreasuryProjectionScenario,
} from "@/lib/dashboard/treasury-projection-scenarios";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

type DashboardTreasuryProjectionPanelProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  projectionPeriod: DashboardKpiPeriod;
  projectionScenario: TreasuryProjectionScenario;
  kpiPeriod: DashboardKpiPeriod;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  snapshot: TreasuryProjectionSnapshot;
  audienceLabel?: string;
};

const PROJECTION_PERIOD_OPTIONS: DashboardKpiPeriod[] = ["month", "quarter", "year"];
const PROJECTION_SCENARIO_OPTIONS: TreasuryProjectionScenario[] = ["optimistic", "probable", "conservative"];

export function DashboardTreasuryProjectionPanel({
  basePath,
  projectionPeriod,
  projectionScenario,
  kpiPeriod,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  snapshot,
  audienceLabel = "PDG, Directeur Technique et Comptable",
}: DashboardTreasuryProjectionPanelProps) {
  const hasBeyondHorizon =
    snapshot.beyondHorizonCollections > 0 ||
    snapshot.beyondHorizonDisbursements > 0;

  return (
    <div className="space-y-4" data-testid="dashboard-treasury-projection-panel">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Prévisions pour {audienceLabel.toLowerCase()} — encaissements attendus et décaissements planifiés.
      </p>

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
              projectionScenario,
            })
          }
        />

        <MbokaPeriodSwitch
          label="Scénario"
          testId="dashboard-projection-scenario-switch"
          value={projectionScenario}
          options={PROJECTION_SCENARIO_OPTIONS.map((value) => ({
            value,
            label: getProjectionScenarioLabel(value),
          }))}
          buildHref={(value) =>
            buildFinancialDashboardHref(basePath, {
              kpiPeriod,
              granularity,
              categoryPeriod,
              occupancyPeriod,
              projectionPeriod,
              projectionScenario: value,
            })
          }
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {getProjectionScenarioHint(projectionScenario)}
      </p>

      <MbokaKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
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
          label="Décaissements prévus"
          value={snapshot.totalExpectedDisbursements}
          hint={`${snapshot.horizonLabel} — ${snapshot.expenseCount} charge${snapshot.expenseCount > 1 ? "s" : ""}`}
          testId="dashboard-projection-kpi-disbursements"
        />
        <MbokaKpiCard
          label="Trésorerie projetée"
          value={snapshot.projectedTreasuryEnd}
          hint={`Fin d'horizon · scénario ${getProjectionScenarioLabel(projectionScenario).toLowerCase()}`}
          testId="dashboard-projection-kpi-end"
        />
      </MbokaKpiGrid>

      {hasBeyondHorizon ? (
        <section
          className={cn(mbokaPanelClassName, "space-y-2 p-4 sm:p-5")}
          data-testid="dashboard-projection-beyond-horizon"
        >
          <h3 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Au-delà de l&apos;horizon</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Flux non inclus dans le graphique mais toujours en portefeuille.
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="text-slate-600 dark:text-slate-300">
              Encaissements :{" "}
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                {formatMoney(snapshot.beyondHorizonCollections)}
              </span>
              {snapshot.beyondHorizonReservationCount > 0
                ? ` (${snapshot.beyondHorizonReservationCount} réservation${snapshot.beyondHorizonReservationCount > 1 ? "s" : ""})`
                : null}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Décaissements :{" "}
              <span className="font-medium text-rose-600 dark:text-rose-300">
                {formatMoney(snapshot.beyondHorizonDisbursements)}
              </span>
              {snapshot.beyondHorizonExpenseCount > 0
                ? ` (${snapshot.beyondHorizonExpenseCount} charge${snapshot.beyondHorizonExpenseCount > 1 ? "s" : ""})`
                : null}
            </p>
          </div>
        </section>
      ) : null}

      <TreasuryProjectionChart
        data={snapshot.points}
        horizonLabel={snapshot.horizonLabel}
        currentNetTreasury={snapshot.currentNetTreasury}
        scenario={projectionScenario}
      />
    </div>
  );
}
