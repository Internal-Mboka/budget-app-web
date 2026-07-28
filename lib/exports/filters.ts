import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";

export type FinancialExportRegister = "revenues" | "expenses" | "journal";

export type FinancialExportFilters = {
  from: string;
  to: string;
  register: FinancialExportRegister;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getDefaultFinancialExportPeriod(reference = new Date()): { from: string; to: string } {
  return {
    from: format(startOfMonth(reference), "yyyy-MM-dd"),
    to: format(endOfMonth(reference), "yyyy-MM-dd"),
  };
}

export function parseFinancialExportRegister(
  value: string | null | undefined
): FinancialExportRegister {
  if (value === "expenses" || value === "journal") {
    return value;
  }

  return "revenues";
}

export function parseFinancialExportFilters(input: {
  from?: string;
  to?: string;
  register?: string;
}): FinancialExportFilters {
  const defaults = getDefaultFinancialExportPeriod();

  return {
    from: input.from?.match(DATE_PATTERN) ? input.from : defaults.from,
    to: input.to?.match(DATE_PATTERN) ? input.to : defaults.to,
    register: parseFinancialExportRegister(input.register),
  };
}

export function getFinancialExportDateRange(filters: FinancialExportFilters): { from: Date; to: Date } {
  return {
    from: startOfDay(new Date(`${filters.from}T12:00:00`)),
    to: endOfDay(new Date(`${filters.to}T12:00:00`)),
  };
}

export function buildFinancialExportQuery(filters: FinancialExportFilters): string {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    register: filters.register,
  });

  return params.toString();
}
