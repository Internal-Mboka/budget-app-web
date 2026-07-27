import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardAnalyticsPanel } from "@/components/organisms/dashboard-analytics-panel";
import { DashboardKpiScopeSwitch } from "@/components/molecules/dashboard-kpi-scope-switch";
import { MbokaKpiCard } from "@/components/molecules/mboka-kpi-card";
import { MbokaKpiBoard, MbokaKpiBoardGroup } from "@/components/molecules/mboka-kpi-section";
import type { DashboardKpiComparison } from "@/lib/dashboard/kpi-comparison";
import type { RevenueExpenseComparisonPoint } from "@/lib/dashboard/enrich-series-comparison";
import type { DashboardAccountingMode } from "@/lib/dashboard/accounting-mode";
import type { DashboardKpis } from "@/lib/dashboard/load-analytics";
import type { DashboardKpiScope } from "@/lib/dashboard/kpi-scope";
import type { DashboardChartGranularity, DashboardKpiPeriod } from "@/lib/dashboard/periods";
import type { TreasuryProjectionScenario } from "@/lib/dashboard/treasury-projection-scenarios";

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
}: DashboardFinancialSectionProps) {
  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });
  const activityScope = kpiScope === "global" ? "global" : "period";
  const showActivityDelta = kpiScope === "period";
  const activityGroupLabel = kpiScope === "global" ? "Activité cumulée" : "Activité";

  return (
    <>
      <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
        Données calculées au {updatedLabel}
      </p>

      <MbokaKpiBoard
        headerAction={
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
            className="sm:col-span-2"
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
