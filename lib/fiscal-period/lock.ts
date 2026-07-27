import { startOfDay } from "date-fns";

import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import {
  hasAnyFiscalPeriod,
  loadFiscalPeriodContainingDate,
  loadFiscalPeriodInClosing,
  loadOpenFiscalPeriod,
} from "@/lib/fiscal-period/load-fiscal-periods";
import { getFiscalPeriodStatusLabel, isFiscalPeriodWritable } from "@/lib/fiscal-period/status";

export type FiscalPeriodWriteOperation = "create" | "update" | "adjustment";

export type FiscalPeriodLockResult =
  | { ok: true; period: FiscalPeriodRecord | null }
  | { ok: false; error: string };

function isWithinFiscalPeriod(date: Date, period: FiscalPeriodRecord): boolean {
  const time = date.getTime();
  return time >= new Date(period.startDate).getTime() && time <= new Date(period.endDate).getTime();
}

function buildClosingPeriodError(period: FiscalPeriodRecord): string {
  return `Le trimestre ${period.label} est en clôture. Les saisies sont figées en attente de validation comptable.`;
}

function buildLockedPeriodError(period: FiscalPeriodRecord, operation: FiscalPeriodWriteOperation): string {
  const statusLabel = getFiscalPeriodStatusLabel(period.status).toLowerCase();

  if (operation === "adjustment") {
    return `Le trimestre ${period.label} est ${statusLabel}. Les régularisations ne sont possibles que sur un trimestre ouvert.`;
  }

  return `Le trimestre ${period.label} est ${statusLabel}. Les modifications sur cette période sont bloquées.`;
}

async function assertNoSetupRequired(): Promise<FiscalPeriodLockResult | null> {
  const closingPeriod = await loadFiscalPeriodInClosing();

  if (closingPeriod) {
    return { ok: false, error: buildClosingPeriodError(closingPeriod) };
  }

  return null;
}

/** US-76 : vérifie qu'un trimestre OPEN existe pour les nouvelles saisies. */
export async function assertOpenFiscalPeriodForFinancialWrite(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const result = await assertFiscalPeriodForFinancialWrite("create");

  if (!result.ok) {
    return result;
  }

  return { ok: true };
}

/** US-76 : verrou trimestriel selon l'opération et la date de l'écriture. */
export async function assertFiscalPeriodForFinancialWrite(
  operation: FiscalPeriodWriteOperation = "create",
  transactionDate?: Date
): Promise<FiscalPeriodLockResult> {
  if (operation === "create") {
    const closingBlock = await assertNoSetupRequired();
    if (closingBlock) {
      return closingBlock;
    }

    const openPeriod = await loadOpenFiscalPeriod();

    if (!openPeriod) {
      if (!(await hasAnyFiscalPeriod())) {
        return {
          ok: false,
          error:
            "Aucun trimestre comptable ouvert. Le PDG ou le DT doit initialiser le 1er trimestre depuis le tableau de bord.",
        };
      }

      return {
        ok: false,
        error: "Aucun trimestre comptable ouvert. Attendez l'ouverture du trimestre suivant.",
      };
    }

    const referenceDate = transactionDate ?? new Date();

    if (!isWithinFiscalPeriod(referenceDate, openPeriod)) {
      return {
        ok: false,
        error: `La date saisie est hors du trimestre ouvert ${openPeriod.label}.`,
      };
    }

    return { ok: true, period: openPeriod };
  }

  if (!transactionDate) {
    return { ok: false, error: "Date d'écriture requise pour vérifier le verrou trimestriel." };
  }

  const period = await loadFiscalPeriodContainingDate(transactionDate);

  if (!period) {
    const openPeriod = await loadOpenFiscalPeriod();

    if (!openPeriod) {
      const closingBlock = await assertNoSetupRequired();
      if (closingBlock) {
        return closingBlock;
      }

      return {
        ok: false,
        error: "Aucun trimestre comptable ouvert pour cette opération.",
      };
    }

    return { ok: true, period: openPeriod };
  }

  if (!isFiscalPeriodWritable(period.status)) {
    return { ok: false, error: buildLockedPeriodError(period, operation) };
  }

  return { ok: true, period };
}

/** US-76 : chaîne verrou trimestriel + caisse journalière (SPEC 5 + SPEC 10). */
export async function assertFinancialWriteLocks(input?: {
  operation?: FiscalPeriodWriteOperation;
  transactionDate?: Date;
  skipCashDay?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const operation = input?.operation ?? "create";

  const fiscalLock = await assertFiscalPeriodForFinancialWrite(operation, input?.transactionDate);

  if (!fiscalLock.ok) {
    return fiscalLock;
  }

  if (input?.skipCashDay || operation !== "create") {
    return { ok: true };
  }

  const { assertTodayCashDayOpen } = await import("@/lib/cash-closing/lock");
  return assertTodayCashDayOpen();
}

export function normalizeTransactionLockDate(date: Date): Date {
  return startOfDay(date);
}
