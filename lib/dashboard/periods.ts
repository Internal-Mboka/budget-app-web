import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";

export type DashboardKpiPeriod = "month" | "quarter" | "year";
export type MacroKpiPeriod = DashboardKpiPeriod;
export type DashboardChartGranularity = "day" | "week" | "month" | "quarter" | "year";

const KPI_PERIOD_VALUES: DashboardKpiPeriod[] = ["month", "quarter", "year"];
const CHART_GRANULARITY_VALUES: DashboardChartGranularity[] = ["day", "week", "month", "quarter", "year"];
const MACRO_PERIOD_VALUES: MacroKpiPeriod[] = ["month", "quarter", "year"];

export function parseDashboardKpiPeriod(value?: string | string[]): DashboardKpiPeriod {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && KPI_PERIOD_VALUES.includes(raw as DashboardKpiPeriod)) {
    return raw as DashboardKpiPeriod;
  }

  return "month";
}

export function parseDashboardChartGranularity(value?: string | string[]): DashboardChartGranularity {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && CHART_GRANULARITY_VALUES.includes(raw as DashboardChartGranularity)) {
    return raw as DashboardChartGranularity;
  }

  return "month";
}

export function parseMacroKpiPeriod(value?: string | string[]): MacroKpiPeriod {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && MACRO_PERIOD_VALUES.includes(raw as MacroKpiPeriod)) {
    return raw as MacroKpiPeriod;
  }

  return "month";
}

export function parseCategoryPeriod(
  value: string | string[] | undefined,
  fallback: DashboardKpiPeriod = "month"
): DashboardKpiPeriod {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && KPI_PERIOD_VALUES.includes(raw as DashboardKpiPeriod)) {
    return raw as DashboardKpiPeriod;
  }

  return fallback;
}

export function getKpiPeriodRange(period: DashboardKpiPeriod, reference = new Date()) {
  switch (period) {
    case "quarter":
      return {
        from: startOfQuarter(reference),
        to: endOfDay(reference),
        label: "Trimestre en cours",
      };
    case "year":
      return {
        from: startOfYear(reference),
        to: endOfDay(reference),
        label: "Année en cours",
      };
    default:
      return {
        from: startOfMonth(reference),
        to: endOfDay(reference),
        label: "Mois en cours",
      };
  }
}

export function getChartRange(granularity: DashboardChartGranularity, reference = new Date()) {
  switch (granularity) {
    case "day":
      return {
        from: startOfDay(subDays(reference, 29)),
        to: endOfDay(reference),
        bucketCount: 30,
      };
    case "week":
      return {
        from: startOfWeek(subWeeks(reference, 11), { weekStartsOn: 1 }),
        to: endOfWeek(reference, { weekStartsOn: 1 }),
        bucketCount: 12,
      };
    case "quarter":
      return {
        from: startOfQuarter(subQuarters(reference, 3)),
        to: endOfQuarter(reference),
        bucketCount: 4,
      };
    case "year":
      return {
        from: startOfMonth(subMonths(reference, 11)),
        to: endOfMonth(reference),
        bucketCount: 12,
      };
    default:
      return {
        from: startOfMonth(subMonths(reference, 11)),
        to: endOfMonth(reference),
        bucketCount: 12,
      };
  }
}

export function formatChartBucketLabel(date: Date, granularity: DashboardChartGranularity): string {
  switch (granularity) {
    case "day":
      return format(date, "d MMM", { locale: fr });
    case "week":
      return format(date, "'S'w MMM", { locale: fr });
    case "quarter":
      return format(date, "'T'Q yyyy", { locale: fr });
    case "year":
      return format(date, "MMM yyyy", { locale: fr });
    default:
      return format(date, "MMM yyyy", { locale: fr });
  }
}

export function getGranularityLabel(granularity: DashboardChartGranularity): string {
  switch (granularity) {
    case "day":
      return "Jour";
    case "week":
      return "Semaine";
    case "quarter":
      return "Trimestre";
    case "year":
      return "Année";
    default:
      return "Mois";
  }
}

export function getKpiPeriodLabel(period: DashboardKpiPeriod): string {
  switch (period) {
    case "quarter":
      return "Trimestre";
    case "year":
      return "Année";
    default:
      return "Mois";
  }
}

export function countDaysInclusive(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from) + 1;
}
