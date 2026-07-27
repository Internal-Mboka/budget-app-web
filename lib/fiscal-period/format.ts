import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatFiscalPeriodDate(isoDate: string): string {
  return format(new Date(isoDate), "d MMM yyyy", { locale: fr });
}

export function formatFiscalPeriodRange(startDate: string, endDate: string): string {
  return `${formatFiscalPeriodDate(startDate)} → ${formatFiscalPeriodDate(endDate)}`;
}
