import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

import type { FinancialExportFilters } from "@/lib/exports/filters";
import { getFinancialExportDateRange } from "@/lib/exports/filters";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function buildPeriodKey(from: string): string {
  return from.slice(0, 7);
}

export function buildPeriodDocumentCode(periodKey: string): string {
  return `BP-${periodKey}`;
}

export function buildFiscalPeriodKey(label: string): string {
  return label.trim().replace(/\s+/g, "-");
}

export function buildFiscalPeriodDocumentCode(label: string): string {
  return `BQ-${buildFiscalPeriodKey(label)}`;
}

export function buildFiscalPeriodBalanceLabel(startDate: string, endDate: string): string {
  return buildPeriodLabel(startDate.slice(0, 10), endDate.slice(0, 10));
}

export function buildPeriodLabel(from: string, to: string): string {
  const start = parseISO(`${from}T12:00:00`);
  const end = parseISO(`${to}T12:00:00`);
  return `${format(start, "d MMM yyyy", { locale: fr })} → ${format(end, "d MMM yyyy", { locale: fr })}`;
}

export function isFullCivilMonthPeriod(filters: FinancialExportFilters): boolean {
  if (!DATE_PATTERN.test(filters.from) || !DATE_PATTERN.test(filters.to)) {
    return false;
  }

  const reference = parseISO(`${filters.from}T12:00:00`);
  const expectedFrom = format(startOfMonth(reference), "yyyy-MM-dd");
  const expectedTo = format(endOfMonth(reference), "yyyy-MM-dd");

  return filters.from === expectedFrom && filters.to === expectedTo;
}

export function getPeriodDateRange(filters: FinancialExportFilters): { from: Date; to: Date } {
  return getFinancialExportDateRange(filters);
}

export function isDateWithinPeriod(date: Date, startDate: Date, endDate: Date): boolean {
  const value = date.getTime();
  return value >= startDate.getTime() && value <= endDate.getTime();
}
