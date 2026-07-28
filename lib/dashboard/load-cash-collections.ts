import { Prisma } from "@prisma/client";

import { parseRevenuePaymentHistory } from "@/lib/revenues/payment-history";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

const REVENUE_COLLECTION_WHERE = Prisma.sql`
  t.type = 'REVENUE'::"TransactionType"
  AND t."isAdjustment" = false
  AND t.status <> 'LITIGE_ANNULE'::"PaymentStatus"
`;

type CollectionAmountRow = {
  amount: Prisma.Decimal | number | string;
};

async function sumPaymentHistoryCollections(from: Date, to: Date) {
  const rows = await prisma.$queryRaw<CollectionAmountRow[]>(Prisma.sql`
    SELECT (entry->>'amount')::numeric AS amount
    FROM "Transaction" t
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(t.metadata->'paymentHistory') = 'array'
        THEN t.metadata->'paymentHistory'
        ELSE '[]'::jsonb
      END
    ) AS entry
    WHERE ${REVENUE_COLLECTION_WHERE}
      AND (entry->>'recordedAt')::timestamptz >= ${from}
      AND (entry->>'recordedAt')::timestamptz <= ${to}
      AND COALESCE((entry->>'amount')::numeric, 0) > 0
  `);

  return roundMoney(rows.reduce((sum, row) => sum + decimalToNumber(row.amount), 0));
}

async function sumLegacyCollections(from?: Date, to?: Date) {
  const legacyCandidates = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      paidAmount: { gt: 0 },
      ...(from && to ? { createdAt: { gte: from, lte: to } } : {}),
    },
    select: {
      metadata: true,
      paidAmount: true,
    },
  });

  return roundMoney(
    legacyCandidates.reduce((sum, revenue) => {
      if (parseRevenuePaymentHistory(revenue.metadata).length > 0) {
        return sum;
      }

      return sum + decimalToNumber(revenue.paidAmount);
    }, 0)
  );
}

/** Encaissements réels sur une période — dates de paiement (`paymentHistory.recordedAt`, fallback `createdAt`). */
export async function loadPeriodCashCollections(from: Date, to: Date): Promise<number> {
  const [historyTotal, legacyTotal] = await Promise.all([
    sumPaymentHistoryCollections(from, to),
    sumLegacyCollections(from, to),
  ]);

  return roundMoney(historyTotal + legacyTotal);
}

/** Encaissements réels cumulés — toutes périodes. */
export async function loadGlobalCashCollections(): Promise<number> {
  const rows = await prisma.$queryRaw<CollectionAmountRow[]>(Prisma.sql`
    SELECT (entry->>'amount')::numeric AS amount
    FROM "Transaction" t
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(t.metadata->'paymentHistory') = 'array'
        THEN t.metadata->'paymentHistory'
        ELSE '[]'::jsonb
      END
    ) AS entry
    WHERE ${REVENUE_COLLECTION_WHERE}
      AND COALESCE((entry->>'amount')::numeric, 0) > 0
  `);

  const historyTotal = roundMoney(rows.reduce((sum, row) => sum + decimalToNumber(row.amount), 0));
  const legacyTotal = await sumLegacyCollections();

  return roundMoney(historyTotal + legacyTotal);
}

const ACTIVE_EXPENSE_WHERE = {
  type: "EXPENSE" as const,
  isAdjustment: false,
  approvalStatus: { not: "REJECTED" as const },
};

/** Décaissements réels sur une période — `paidAmount` à la date de saisie (date de paiement). */
export async function loadPeriodCashDisbursements(from: Date, to: Date): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_EXPENSE_WHERE,
      paidAmount: { gt: 0 },
      createdAt: { gte: from, lte: to },
    },
    select: { paidAmount: true },
  });

  return roundMoney(rows.reduce((sum, row) => sum + decimalToNumber(row.paidAmount), 0));
}

/** Décaissements réels cumulés — toutes périodes. */
export async function loadGlobalCashDisbursements(): Promise<number> {
  const rows = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_EXPENSE_WHERE,
      paidAmount: { gt: 0 },
    },
    select: { paidAmount: true },
  });

  return roundMoney(rows.reduce((sum, row) => sum + decimalToNumber(row.paidAmount), 0));
}

type CashMovementRow = {
  amount: Prisma.Decimal | number | string;
  movementAt: Date;
};

/** Mouvements encaissement revenus dans une plage — pour graphiques et ventilation. */
export async function loadCashRevenueMovements(from: Date, to: Date): Promise<CashMovementRow[]> {
  const historyRows = await prisma.$queryRaw<Array<{ amount: Prisma.Decimal | number | string; movementAt: Date }>>(
    Prisma.sql`
      SELECT
        (entry->>'amount')::numeric AS amount,
        (entry->>'recordedAt')::timestamptz AS "movementAt"
      FROM "Transaction" t
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(t.metadata->'paymentHistory') = 'array'
          THEN t.metadata->'paymentHistory'
          ELSE '[]'::jsonb
        END
      ) AS entry
      WHERE ${REVENUE_COLLECTION_WHERE}
        AND (entry->>'recordedAt')::timestamptz >= ${from}
        AND (entry->>'recordedAt')::timestamptz <= ${to}
        AND COALESCE((entry->>'amount')::numeric, 0) > 0
    `
  );

  const legacyCandidates = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      paidAmount: { gt: 0 },
      createdAt: { gte: from, lte: to },
    },
    select: {
      metadata: true,
      paidAmount: true,
      createdAt: true,
    },
  });

  const legacyRows = legacyCandidates
    .filter((revenue) => parseRevenuePaymentHistory(revenue.metadata).length === 0)
    .map((revenue) => ({
      amount: revenue.paidAmount,
      movementAt: revenue.createdAt,
    }));

  return [...historyRows, ...legacyRows];
}

type CashRevenueCategoryRow = {
  revenueCategory: string | null;
  amount: Prisma.Decimal | number | string;
};

/** Ventilation CA en mode encaissement — par date de paiement. */
export async function loadCashRevenueByCategory(from: Date, to: Date) {
  const historyRows = await prisma.$queryRaw<CashRevenueCategoryRow[]>(Prisma.sql`
    SELECT
      t."revenueCategory"::text AS "revenueCategory",
      (entry->>'amount')::numeric AS amount
    FROM "Transaction" t
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(t.metadata->'paymentHistory') = 'array'
        THEN t.metadata->'paymentHistory'
        ELSE '[]'::jsonb
      END
    ) AS entry
    WHERE ${REVENUE_COLLECTION_WHERE}
      AND t."revenueCategory" IS NOT NULL
      AND (entry->>'recordedAt')::timestamptz >= ${from}
      AND (entry->>'recordedAt')::timestamptz <= ${to}
      AND COALESCE((entry->>'amount')::numeric, 0) > 0
  `);

  const legacyCandidates = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      paidAmount: { gt: 0 },
      revenueCategory: { not: null },
      createdAt: { gte: from, lte: to },
    },
    select: {
      metadata: true,
      paidAmount: true,
      revenueCategory: true,
    },
  });

  return [
    ...historyRows,
    ...legacyCandidates
      .filter((revenue) => parseRevenuePaymentHistory(revenue.metadata).length === 0)
      .map((revenue) => ({
        revenueCategory: revenue.revenueCategory,
        amount: revenue.paidAmount,
      })),
  ];
}
