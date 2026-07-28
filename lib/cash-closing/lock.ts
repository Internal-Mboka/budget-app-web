import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { formatClosingDateInput } from "@/lib/cash-closing/day-range";
import { loadClosingForDate } from "@/lib/cash-closing/load-closings";

export async function isCashDayClosed(closingDate: string): Promise<boolean> {
  const existing = await loadClosingForDate(closingDate);
  return existing !== null;
}

export async function assertCashDayOpen(
  closingDate: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await loadClosingForDate(closingDate);

  if (!existing) {
    return { ok: true };
  }

  const label = format(parseISO(`${closingDate}T12:00:00`), "d MMMM yyyy", { locale: fr });

  return {
    ok: false,
    error: `La caisse du ${label} est déjà clôturée. Utilisez une régularisation sur la journée en cours si besoin.`,
  };
}

export async function assertTodayCashDayOpen(): Promise<{ ok: true } | { ok: false; error: string }> {
  return assertCashDayOpen(formatClosingDateInput());
}
