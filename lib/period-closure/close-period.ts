import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasAnyPermission } from "@/lib/auth/session";
import { parseFinancialExportFilters } from "@/lib/exports/filters";
import { buildPeriodLabel, getPeriodDateRange, isFullCivilMonthPeriod } from "@/lib/period-closure/dates";
import { formatIntegrityHashForDisplay } from "@/lib/period-closure/integrity";
import { loadFinancialPeriodClosureByFiscalPeriodId, loadFinancialPeriodClosureForFilters } from "@/lib/period-closure/load-closures";
import {
  buildPeriodBalanceSnapshotWithHash,
  loadPeriodBalanceMetrics,
  mapClosureSnapshotToPdfData,
} from "@/lib/period-closure/load-period-balance";
import type { PeriodBalancePdfData } from "@/lib/period-closure/pdf/types";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

export type CloseFinancialPeriodResult =
  | { success: true; closureId: string; documentCode: string }
  | { success: false; error: string };

export async function closeFinancialPeriodAction(input: {
  from: string;
  to: string;
}): Promise<CloseFinancialPeriodResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    return { success: false, error: "Clôture réservée au PDG et au Comptable." };
  }

  const filters = parseFinancialExportFilters(input);

  if (!isFullCivilMonthPeriod(filters)) {
    return {
      success: false,
      error: "Seul un mois civil complet peut être clôturé (du 1er au dernier jour du mois).",
    };
  }

  const existing = await loadFinancialPeriodClosureForFilters(filters);

  if (existing) {
    return { success: false, error: "Ce mois est déjà clôturé." };
  }

  const metrics = await loadPeriodBalanceMetrics(filters);

  if (!metrics) {
    return { success: false, error: "Impossible de calculer le bilan pour cette période." };
  }

  const snapshot = buildPeriodBalanceSnapshotWithHash(metrics);
  const { from, to } = getPeriodDateRange(filters);
  const auditMeta = await captureAuditRequestContext();

  try {
    const closure = await prisma.financialPeriodClosure.create({
      data: {
        periodKey: snapshot.periodKey,
        startDate: from,
        endDate: to,
        documentCode: snapshot.documentCode,
        revenueTotal: snapshot.revenueTotal,
        expenseTotal: snapshot.expenseTotal,
        creditTotal: snapshot.creditTotal,
        netBalance: snapshot.netBalance,
        paidRevenueTotal: snapshot.paidRevenueTotal,
        paidExpenseTotal: snapshot.paidExpenseTotal,
        netCashFlow: snapshot.netCashFlow,
        revenueCount: snapshot.revenueCount,
        expenseCount: snapshot.expenseCount,
        creditCount: snapshot.creditCount,
        integrityHash: snapshot.integrityHash,
        closedByUserId: session.user.id,
      },
      select: { id: true, documentCode: true },
    });

    await writeAuditLog({
      requestMeta: auditMeta,
      captureRequest: false,
      action: "FINANCIAL_PERIOD_CLOSED",
      entity: "FinancialPeriodClosure",
      entityId: closure.id,
      userId: session.user.id,
      details: {
        periodKey: snapshot.periodKey,
        from: snapshot.from,
        to: snapshot.to,
        documentCode: snapshot.documentCode,
        integrityHash: snapshot.integrityHash,
        netBalance: snapshot.netBalance,
      },
    });

    return { success: true, closureId: closure.id, documentCode: closure.documentCode };
  } catch (error) {
    console.error("financial period closure failed", error);
    return { success: false, error: "Impossible de clôturer cette période." };
  }
}

export async function loadPeriodBalancePdfData(input: {
  from: string;
  to: string;
  preview?: boolean;
}): Promise<PeriodBalancePdfData | null> {
  const filters = parseFinancialExportFilters(input);

  if (!isFullCivilMonthPeriod(filters)) {
    return null;
  }

  const closure = await loadFinancialPeriodClosureForFilters(filters);
  const issuedAt = new Date().toISOString();
  const periodLabel = buildPeriodLabel(filters.from, filters.to);

  if (closure) {
    return mapClosureSnapshotToPdfData({
      snapshot: {
        periodKey: closure.periodKey,
        from: filters.from,
        to: filters.to,
        documentCode: closure.documentCode,
        revenueTotal: closure.revenueTotal,
        expenseTotal: closure.expenseTotal,
        creditTotal: closure.creditTotal,
        netBalance: closure.netBalance,
        paidRevenueTotal: closure.paidRevenueTotal,
        paidExpenseTotal: closure.paidExpenseTotal,
        netCashFlow: closure.netCashFlow,
        revenueCount: closure.revenueCount,
        expenseCount: closure.expenseCount,
        creditCount: closure.creditCount,
      },
      integrityHash: closure.integrityHash,
      integrityHashDisplay: formatIntegrityHashForDisplay(closure.integrityHash),
      periodLabel,
      issuedAt,
      closedAt: closure.closedAt,
      closedByName: closure.closedByName,
      isPreview: false,
    });
  }

  if (!input.preview) {
    return null;
  }

  const metrics = await loadPeriodBalanceMetrics(filters);

  if (!metrics) {
    return null;
  }

  const snapshot = buildPeriodBalanceSnapshotWithHash(metrics);

  return mapClosureSnapshotToPdfData({
    snapshot,
    integrityHash: snapshot.integrityHash,
    integrityHashDisplay: formatIntegrityHashForDisplay(snapshot.integrityHash),
    periodLabel,
    issuedAt,
    isPreview: true,
  });
}

export async function loadFiscalPeriodBalancePdfData(
  fiscalPeriodId: string
): Promise<PeriodBalancePdfData | null> {
  const closure = await loadFinancialPeriodClosureByFiscalPeriodId(fiscalPeriodId);

  if (!closure) {
    return null;
  }

  const from = closure.startDate.slice(0, 10);
  const to = closure.endDate.slice(0, 10);

  return mapClosureSnapshotToPdfData({
    snapshot: {
      periodKey: closure.periodKey,
      from,
      to,
      documentCode: closure.documentCode,
      revenueTotal: closure.revenueTotal,
      expenseTotal: closure.expenseTotal,
      creditTotal: closure.creditTotal,
      netBalance: closure.netBalance,
      paidRevenueTotal: closure.paidRevenueTotal,
      paidExpenseTotal: closure.paidExpenseTotal,
      netCashFlow: closure.netCashFlow,
      revenueCount: closure.revenueCount,
      expenseCount: closure.expenseCount,
      creditCount: closure.creditCount,
    },
    integrityHash: closure.integrityHash,
    integrityHashDisplay: formatIntegrityHashForDisplay(closure.integrityHash),
    periodLabel: `${closure.periodKey.replace(/-/g, " ")} · ${buildPeriodLabel(from, to)}`,
    summaryTitle: "Synthèse du trimestre",
    receivableOutstandingTotal: closure.receivableOutstandingTotal,
    receivableCount: closure.receivableCount,
    issuedAt: new Date().toISOString(),
    closedAt: closure.closedAt,
    closedByName: closure.closedByName,
    isPreview: false,
  });
}
