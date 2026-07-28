import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function formatFiscalPeriodDate(isoDate: string): string {
  return format(new Date(isoDate), "d MMM yyyy", { locale: fr });
}

export function formatFiscalPeriodRange(startDate: string, endDate: string): string {
  return `${formatFiscalPeriodDate(startDate)} → ${formatFiscalPeriodDate(endDate)}`;
}

/** US-80 : plage compacte pour bandeau dashboard — ex. « 15 mar – 14 jun ». */
export function formatFiscalPeriodCompactRange(startDate: string, endDate: string): string {
  const start = format(new Date(startDate), "d MMM", { locale: fr });
  const end = format(new Date(endDate), "d MMM", { locale: fr });
  return `${start} – ${end}`;
}
