import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { DashboardAccountingModeSwitch } from "@/components/molecules/dashboard-accounting-mode-switch";
import { DashboardKpiScopeSwitch } from "@/components/molecules/dashboard-kpi-scope-switch";
import { FiscalPeriodCurrentBanner } from "@/components/molecules/fiscal-period-current-banner";
import { MbokaKpiCard } from "@/components/molecules/mboka-kpi-card";
import { MbokaKpiBoard, MbokaKpiBoardGroup } from "@/components/molecules/mboka-kpi-section";
import type { DashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpis } from "@/lib/dashboard/load-analytics";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";

type DashboardFinancialSectionProps = {
  basePath: "/dashboard" | "/dashboard/financier";
  kpis: DashboardKpis;
  comparison: DashboardKpiComparison;
  series: RevenueExpenseComparisonPoint[];
  kpiPeriod: DashboardKpiPeriod;
  kpiScope: DashboardKpiScope;
  accountingMode: DashboardAccountingMode;
  granularity: DashboardChartGranularity;
  categoryPeriod?: DashboardKpiPeriod;
  occupancyPeriod?: DashboardKpiPeriod;
  projectionPeriod?: DashboardKpiPeriod;
  projectionScenario?: TreasuryProjectionScenario;
  activeFiscalPeriod?: FiscalPeriodRecord | null;
};

export function DashboardFinancialSection({
  basePath,
  kpis,
  comparison,
  series,
  kpiPeriod,
  kpiScope,
  accountingMode,
  granularity,
  categoryPeriod,
  occupancyPeriod,
  projectionPeriod,
  projectionScenario,
  activeFiscalPeriod,
}: DashboardFinancialSectionProps) {
  const activityScope = kpiScope === "global" ? "global" : "period";
  const showActivityDelta = kpiScope === "period";
  const activityGroupLabel = kpiScope === "global" ? "Activité cumulée" : "Activité";

  return (
    <>
      {activeFiscalPeriod ? <FiscalPeriodCurrentBanner period={activeFiscalPeriod} /> : null}

      <MbokaKpiBoard
        headerAction={
          <div className="flex flex-wrap items-end gap-3">
            <DashboardAccountingModeSwitch
              basePath={basePath}
              accountingMode={accountingMode}
              kpiPeriod={kpiPeriod}
              kpiScope={kpiScope}
              granularity={granularity}
              categoryPeriod={categoryPeriod}
              occupancyPeriod={occupancyPeriod}
              projectionPeriod={projectionPeriod}
              projectionScenario={projectionScenario}
            />
            <DashboardKpiScopeSwitch
              basePath={basePath}
              kpiPeriod={kpiPeriod}
              kpiScope={kpiScope}
              accountingMode={accountingMode}
              granularity={granularity}
              categoryPeriod={categoryPeriod}
              occupancyPeriod={occupancyPeriod}
              projectionPeriod={projectionPeriod}
              projectionScenario={projectionScenario}
            />
          </div>
        }
      >
        <MbokaKpiBoardGroup
          label={activityGroupLabel}
          scope={activityScope}
          testId="dashboard-kpi-section-activity"
        >
          <MbokaKpiCard
            label="Chiffre d'affaires"
            value={kpis.revenueTotal}
            scope={activityScope}
            size="stat"
            testId="dashboard-kpi-revenue"
            delta={
              showActivityDelta
                ? {
                    percentChange: comparison.revenue.percentChange,
                    comparisonLabel: comparison.revenue.comparisonLabel,
                    polarity: "higher-is-better",
                  }
                : undefined
            }
          />
          <MbokaKpiCard
            label="Dépenses totales"
            value={kpis.expenseTotal}
            scope={activityScope}
            size="stat"
            testId="dashboard-kpi-expenses"
            delta={
              showActivityDelta
                ? {
                    percentChange: comparison.expenses.percentChange,
                    comparisonLabel: comparison.expenses.comparisonLabel,
                    polarity: "lower-is-better",
                  }
                : undefined
            }
          />
          <MbokaKpiCard
            label="Encaissements réels"
            value={kpis.cashCollections}
            hint={kpis.cashCollectionsHint}
            scope={activityScope}
            size="stat"
            testId="dashboard-kpi-cash-collections"
            className="sm:col-span-2"
          />
        </MbokaKpiBoardGroup>

        <MbokaKpiBoardGroup
          label="Trésorerie"
          scope="global"
          testId="dashboard-kpi-section-position"
        >
          <MbokaKpiCard
            label="Trésorerie nette"
            value={kpis.netTreasury}
            hint="Encaissements payés − décaissements payés"
            scope="global"
            size="stat"
            testId="dashboard-kpi-treasury"
            className="sm:col-span-2"
            breakdown={kpis.treasuryByChannel.map((line) => ({
              label: line.label,
              value: line.net,
              testId: `dashboard-kpi-treasury-channel-${line.channel.toLowerCase()}`,
            }))}
          />
          <MbokaKpiCard
            label="Créances clients ouvertes"
            value={kpis.receivables}
            hint="Soldes impayés restant dus"
            scope="global"
            size="stat"
            testId="dashboard-kpi-receivables"
          />
          <MbokaKpiCard
            label="Solde caisse ouvert"
            value={kpis.openCashBalance}
            hint={kpis.openCashBalanceHint}
            scope="global"
            size="stat"
            testId="dashboard-kpi-open-cash-balance"
          />
        </MbokaKpiBoardGroup>
      </MbokaKpiBoard>

      <DashboardAnalyticsPanel
        basePath={basePath}
        kpiPeriod={kpiPeriod}
        kpiScope={kpiScope}
        accountingMode={accountingMode}
        granularity={granularity}
        categoryPeriod={categoryPeriod}
        occupancyPeriod={occupancyPeriod}
        projectionPeriod={projectionPeriod}
        projectionScenario={projectionScenario}
        series={series}
      />
    </>
  );
}
