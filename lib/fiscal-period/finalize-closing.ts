import { writeAuditLog } from "@/lib/audit";
import { archiveFiscalPeriodBalanceClosure } from "@/lib/period-closure/archive-fiscal-period-closure";
import { notifyFiscalPeriodOpened } from "@/lib/alerts/dispatch";
import {
  buildSequentialFiscalPeriodLabel,
  computeFiscalPeriodEndDate,
  computeNextFiscalPeriodStartDate,
  normalizeFiscalPeriodEndDate,
  normalizeFiscalPeriodStartDate,
} from "@/lib/fiscal-period/dates";
import { loadFiscalPeriodClosingSnapshot } from "@/lib/fiscal-period/load-fiscal-period-metrics";
import type { FiscalPeriodRecord } from "@/lib/fiscal-period/load-fiscal-periods";
import { loadFiscalPeriodById } from "@/lib/fiscal-period/load-fiscal-periods";
import { prisma } from "@/lib/prisma";

const fiscalPeriodSelect = {
  id: true,
  label: true,
  startDate: true,
  endDate: true,
  status: true,
  closedAt: true,
  openingBalanceCash: true,
  openingBalanceMobile: true,
  openingBalanceBank: true,
  skipOpeningBalance: true,
  validatedByPdgId: true,
  validatedByAccountantId: true,
} as const;

function mapFiscalPeriodRow(row: {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodRecord["status"];
  closedAt: Date | null;
  openingBalanceCash: { toString(): string } | null;
  openingBalanceMobile: { toString(): string } | null;
  openingBalanceBank: { toString(): string } | null;
  skipOpeningBalance: boolean;
  validatedByPdgId: string | null;
  validatedByAccountantId: string | null;
}): FiscalPeriodRecord {
  return {
    id: row.id,
    label: row.label,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status,
    closedAt: row.closedAt?.toISOString() ?? null,
    openingBalanceCash: row.openingBalanceCash === null ? null : Number(row.openingBalanceCash.toString()),
    openingBalanceMobile:
      row.openingBalanceMobile === null ? null : Number(row.openingBalanceMobile.toString()),
    openingBalanceBank: row.openingBalanceBank === null ? null : Number(row.openingBalanceBank.toString()),
    skipOpeningBalance: row.skipOpeningBalance,
    validatedByPdgId: row.validatedByPdgId,
    validatedByAccountantId: row.validatedByAccountantId,
  };
}

export type FinalizeFiscalPeriodClosingResult = {
  closedPeriod: FiscalPeriodRecord;
  nextPeriod: FiscalPeriodRecord | null;
  snapshot: Awaited<ReturnType<typeof loadFiscalPeriodClosingSnapshot>>;
};

async function buildNextFiscalPeriodLabel(nextStartDate: Date): Promise<string> {
  const existingCount = await prisma.fiscalPeriod.count();
  return buildSequentialFiscalPeriodLabel(existingCount + 1, nextStartDate);
}

/**
 * US-79 : clôture définitive (CLOSED) + snapshot agrégats + ouverture auto T+1.
 * Idempotent si la période est déjà CLOSED ou si T+1 existe déjà.
 */
export async function finalizeApprovedFiscalPeriodClosing(input: {
  periodId: string;
  actorUserId: string;
}): Promise<FinalizeFiscalPeriodClosingResult | null> {
  const period = await loadFiscalPeriodById(input.periodId);

  if (!period || period.status !== "CLOSING" || !period.validatedByPdgId) {
    return null;
  }

  const snapshot = await loadFiscalPeriodClosingSnapshot(period);
  const nextStartDate = normalizeFiscalPeriodStartDate(computeNextFiscalPeriodStartDate(new Date(period.endDate)));
  const nextEndDate = normalizeFiscalPeriodEndDate(computeFiscalPeriodEndDate(nextStartDate));

  const existingNext = await prisma.fiscalPeriod.findFirst({
    where: { startDate: nextStartDate },
    select: fiscalPeriodSelect,
  });

  const closedAt = new Date();
  let createdNextPeriod = false;

  const result = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.fiscalPeriod.updateMany({
      where: { id: period.id, status: "CLOSING" },
      data: {
        status: "CLOSED",
        closedAt,
      },
    });

    if (updateResult.count === 0) {
      const alreadyClosed = await tx.fiscalPeriod.findUnique({
        where: { id: period.id },
        select: fiscalPeriodSelect,
      });

      if (!alreadyClosed || alreadyClosed.status !== "CLOSED") {
        return null;
      }

      const nextPeriod = existingNext ? mapFiscalPeriodRow(existingNext) : null;

      return {
        closedPeriod: mapFiscalPeriodRow(alreadyClosed),
        nextPeriod,
        snapshot,
        didClose: false,
      };
    }

    let nextPeriodRow = existingNext;

    if (!nextPeriodRow) {
      const nextLabel = await buildNextFiscalPeriodLabel(nextStartDate);

      nextPeriodRow = await tx.fiscalPeriod.create({
        data: {
          label: nextLabel,
          startDate: nextStartDate,
          endDate: nextEndDate,
          status: "OPEN",
          skipOpeningBalance: true,
        },
        select: fiscalPeriodSelect,
      });

      createdNextPeriod = true;
    }

    const closedRow = await tx.fiscalPeriod.findUniqueOrThrow({
      where: { id: period.id },
      select: fiscalPeriodSelect,
    });

    return {
      closedPeriod: mapFiscalPeriodRow(closedRow),
      nextPeriod: mapFiscalPeriodRow(nextPeriodRow),
      snapshot,
      didClose: true,
    };
  });

  if (!result) {
    return null;
  }

  if (result.didClose) {
    await writeAuditLog({
      action: "FISCAL_PERIOD_CLOSED",
      entity: "FiscalPeriod",
      entityId: period.id,
      userId: input.actorUserId,
      captureRequest: false,
      details: {
        label: period.label,
        closedAt: closedAt.toISOString(),
        snapshot: result.snapshot,
      },
    });

    const archived = await archiveFiscalPeriodBalanceClosure({
      period: result.closedPeriod,
      snapshot: result.snapshot,
      closedByUserId: input.actorUserId,
      closedAt,
    });

    if (archived) {
      await writeAuditLog({
        action: "FINANCIAL_PERIOD_CLOSED",
        entity: "FinancialPeriodClosure",
        entityId: archived.closureId,
        userId: input.actorUserId,
        captureRequest: false,
        details: {
          fiscalPeriodLabel: period.label,
          documentCode: archived.documentCode,
          trigger: "fiscal_period_finalize",
        },
      });
    }

    if (createdNextPeriod && result.nextPeriod) {
      await writeAuditLog({
        action: "FISCAL_PERIOD_OPENED",
        entity: "FiscalPeriod",
        entityId: result.nextPeriod.id,
        userId: input.actorUserId,
        captureRequest: false,
        details: {
          label: result.nextPeriod.label,
          previousPeriodLabel: period.label,
          startDate: result.nextPeriod.startDate,
          endDate: result.nextPeriod.endDate,
          trigger: "automatic_t_plus_one",
        },
      });
    }
  }

  const { didClose: _didClose, ...finalizedResult } = result;

  if (finalizedResult.nextPeriod && createdNextPeriod) {
    void notifyFiscalPeriodOpened({
      closedPeriodLabel: period.label,
      nextPeriodId: finalizedResult.nextPeriod.id,
      nextPeriodLabel: finalizedResult.nextPeriod.label,
      triggeredByUserId: input.actorUserId,
    });
  }

  return finalizedResult;
}

/** US-79 : finalise toutes les clôtures validées encore en CLOSING (rattrapage idempotent). */
export async function syncApprovedFiscalPeriodClosings(input: {
  actorUserId: string;
}): Promise<FinalizeFiscalPeriodClosingResult[]> {
  const pending = await prisma.fiscalPeriod.findMany({
    where: {
      status: "CLOSING",
      validatedByPdgId: { not: null },
    },
    orderBy: [{ endDate: "asc" }],
    select: { id: true },
  });

  const finalized: FinalizeFiscalPeriodClosingResult[] = [];

  for (const period of pending) {
    const result = await finalizeApprovedFiscalPeriodClosing({
      periodId: period.id,
      actorUserId: input.actorUserId,
    });

    if (result) {
      finalized.push(result);
    }
  }

  return finalized;
}

/** US-79 : hook démarrage serveur (instrumentation). */
export async function syncApprovedFiscalPeriodClosingsOnStartup(): Promise<void> {
  const { resolveFiscalPeriodSystemActorUserId } = await import(
    "@/lib/fiscal-period/sync-expired-periods"
  );
  const actorUserId = await resolveFiscalPeriodSystemActorUserId();

  if (!actorUserId) {
    return;
  }

  try {
    await syncApprovedFiscalPeriodClosings({ actorUserId });
  } catch (error) {
    console.error("syncApprovedFiscalPeriodClosingsOnStartup failed", error);
  }
}
