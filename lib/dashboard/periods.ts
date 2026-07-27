import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";

export type DashboardChartGranularity = "day" | "week" | "month";

const GRANULARITY_VALUES: DashboardChartGranularity[] = ["day", "week", "month"];

export function parseDashboardChartGranularity(value?: string | string[]): DashboardChartGranularity {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && GRANULARITY_VALUES.includes(raw as DashboardChartGranularity)) {
    return raw as DashboardChartGranularity;
  }

  return "month";
}

export function getCurrentMonthRange(reference = new Date()) {
  return {
    from: startOfMonth(reference),
    to: endOfDay(reference),
  };
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
    case "month":
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
    case "month":
      return format(date, "MMM yyyy", { locale: fr });
  }
}

export function getGranularityLabel(granularity: DashboardChartGranularity): string {
  switch (granularity) {
    case "day":
      return "Jour";
    case "week":
      return "Semaine";
    case "month":
      return "Mois";
  }
}
