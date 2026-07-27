import { addDays, addMonths, endOfDay, startOfDay, subDays } from "date-fns";

/** Fin de trimestre Mboka : début + 3 mois − 1 jour (inclus). */
export function computeFiscalPeriodEndDate(startDate: Date): Date {
  return endOfDay(subDays(addMonths(startOfDay(startDate), 3), 1));
}

export function normalizeFiscalPeriodStartDate(startDate: Date): Date {
  return startOfDay(startDate);
}

export function normalizeFiscalPeriodEndDate(endDate: Date): Date {
  return endOfDay(endDate);
}

/** Prochaine date de début enchaînée (jour suivant la fin). */
export function computeNextFiscalPeriodStartDate(previousEndDate: Date): Date {
  return startOfDay(addDays(startOfDay(previousEndDate), 1));
}

/** Numéro de trimestre calendaire (1–4) pour libellé T{n}. */
export function getFiscalQuarterNumber(referenceDate: Date): number {
  const month = referenceDate.getMonth();
  return Math.floor(month / 3) + 1;
}

export function buildDefaultFiscalPeriodLabel(referenceDate: Date): string {
  const quarter = getFiscalQuarterNumber(referenceDate);
  return `T${quarter} ${referenceDate.getFullYear()}`;
}

export function buildSequentialFiscalPeriodLabel(sequence: number, referenceDate: Date): string {
  return `T${sequence} ${referenceDate.getFullYear()}`;
}
