import { startOfDay } from "date-fns";

import { writeAuditLog } from "@/lib/audit";
import { notifyFiscalPeriodClosingPending } from "@/lib/alerts/dispatch";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/permissions";

import type { FiscalPeriodRecord } from "./load-fiscal-periods";

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

function mapRow(row: {
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
    openingBalanceCash:
      row.openingBalanceCash === null ? null : Number(row.openingBalanceCash.toString()),
    openingBalanceMobile:
      row.openingBalanceMobile === null ? null : Number(row.openingBalanceMobile.toString()),
    openingBalanceBank:
      row.openingBalanceBank === null ? null : Number(row.openingBalanceBank.toString()),
    skipOpeningBalance: row.skipOpeningBalance,
    validatedByPdgId: row.validatedByPdgId,
    validatedByAccountantId: row.validatedByAccountantId,
  };
}

/** Acteur système pour l'audit au démarrage serveur (PDG seed ou premier compte actif). */
export async function resolveFiscalPeriodSystemActorUserId(): Promise<string | null> {
  const pdg = await prisma.user.findFirst({
    where: { isActive: true, role: { name: ROLES.PDG } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (pdg) {
    return pdg.id;
  }

  const fallback = await prisma.user.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return fallback?.id ?? null;
}

export type SyncExpiredFiscalPeriodsResult = {
  transitioned: FiscalPeriodRecord[];
};

/**
 * US-77 : passe en CLOSING les trimestres OPEN dont la date de fin est dépassée.
 * Idempotent — safe à appeler à chaque requête layout ou au démarrage serveur.
 */
export async function syncExpiredFiscalPeriodsToClosing(input: {
  actorUserId: string;
}): Promise<SyncExpiredFiscalPeriodsResult> {
  const today = startOfDay(new Date());

  const expiredOpen = await prisma.fiscalPeriod.findMany({
    where: {
      status: "OPEN",
      endDate: { lt: today },
    },
    orderBy: [{ endDate: "asc" }],
    select: fiscalPeriodSelect,
  });

  const transitioned: FiscalPeriodRecord[] = [];

  for (const period of expiredOpen) {
    const updateResult = await prisma.fiscalPeriod.updateMany({
      where: {
        id: period.id,
        status: "OPEN",
      },
      data: {
        status: "CLOSING",
      },
    });

    if (updateResult.count === 0) {
      continue;
    }

    const updated = await prisma.fiscalPeriod.findUniqueOrThrow({
      where: { id: period.id },
      select: fiscalPeriodSelect,
    });

    await writeAuditLog({
      action: "FISCAL_PERIOD_CLOSING_REQUESTED",
      entity: "FiscalPeriod",
      entityId: period.id,
      userId: input.actorUserId,
      captureRequest: false,
      details: {
        label: period.label,
        previousStatus: "OPEN",
        newStatus: "CLOSING",
        trigger: "automatic_expiry",
        endDate: period.endDate.toISOString(),
        syncedAt: new Date().toISOString(),
      },
    });

    void notifyFiscalPeriodClosingPending({
      periodId: period.id,
      periodLabel: period.label,
      endDate: period.endDate.toISOString(),
      triggeredByUserId: input.actorUserId,
    });

    transitioned.push(mapRow(updated));
  }

  return { transitioned };
}

/** US-77 : hook démarrage serveur (instrumentation). */
export async function syncExpiredFiscalPeriodsOnStartup(): Promise<void> {
  const actorUserId = await resolveFiscalPeriodSystemActorUserId();

  if (!actorUserId) {
    return;
  }

  try {
    await syncExpiredFiscalPeriodsToClosing({ actorUserId });
  } catch (error) {
    console.error("syncExpiredFiscalPeriodsOnStartup failed", error);
  }
}
