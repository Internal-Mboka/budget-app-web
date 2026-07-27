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
