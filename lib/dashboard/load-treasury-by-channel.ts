import type { PaymentMethod } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { parseRevenuePaymentHistory } from "@/lib/revenues/payment-history";
import { PAYMENT_METHOD_LABELS } from "@/lib/transactions/payment-methods";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, roundMoney } from "@/lib/transactions/decimal";

export type TreasuryChannelKey = "CASH" | "MOBILE_MONEY" | "VIREMENT_BANCAIRE" | "AUTRE";

export type TreasuryChannelBalance = {
  channel: TreasuryChannelKey;
  label: string;
  net: number;
};

const TREASURY_CHANNEL_ORDER: TreasuryChannelKey[] = [
  "CASH",
  "MOBILE_MONEY",
  "VIREMENT_BANCAIRE",
  "AUTRE",
];

const REVENUE_COLLECTION_WHERE = Prisma.sql`
  t.type = 'REVENUE'::"TransactionType"
  AND t."isAdjustment" = false
  AND t.status <> 'LITIGE_ANNULE'::"PaymentStatus"
`;

const ACTIVE_EXPENSE_WHERE = {
  type: "EXPENSE" as const,
  isAdjustment: false,
  approvalStatus: { not: "REJECTED" as const },
};

function createEmptyChannelTotals(): Record<TreasuryChannelKey, number> {
  return {
    CASH: 0,
    MOBILE_MONEY: 0,
    VIREMENT_BANCAIRE: 0,
    AUTRE: 0,
  };
}

function resolveChannel(
  paymentMethod: PaymentMethod | string | null | undefined,
  fallbackMethod: PaymentMethod | string | null | undefined
): TreasuryChannelKey | null {
  const method = (paymentMethod ?? fallbackMethod) as TreasuryChannelKey | null | undefined;

  if (!method || !TREASURY_CHANNEL_ORDER.includes(method)) {
    return null;
  }

  return method;
}

function addToChannel(
  totals: Record<TreasuryChannelKey, number>,
  paymentMethod: PaymentMethod | string | null | undefined,
  fallbackMethod: PaymentMethod | string | null | undefined,
  signedAmount: number
): void {
  if (signedAmount === 0) {
    return;
  }

  const channel = resolveChannel(paymentMethod, fallbackMethod);

  if (!channel) {
    return;
  }

  totals[channel] = roundMoney(totals[channel] + signedAmount);
}

type RevenuePaymentRow = {
  amount: Prisma.Decimal | number | string;
  entryPaymentMethod: string | null;
  fallbackPaymentMethod: string | null;
};

async function loadRevenueCollectionsByChannel(): Promise<Record<TreasuryChannelKey, number>> {
  const totals = createEmptyChannelTotals();

  const historyRows = await prisma.$queryRaw<RevenuePaymentRow[]>(Prisma.sql`
    SELECT
      (entry->>'amount')::numeric AS amount,
      entry->>'paymentMethod' AS "entryPaymentMethod",
      t."paymentMethod"::text AS "fallbackPaymentMethod"
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

  for (const row of historyRows) {
    addToChannel(
      totals,
      row.entryPaymentMethod,
      row.fallbackPaymentMethod,
      decimalToNumber(row.amount)
    );
  }

  const legacyCandidates = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      paidAmount: { gt: 0 },
    },
    select: {
      metadata: true,
      paymentMethod: true,
      paidAmount: true,
    },
  });

  for (const revenue of legacyCandidates) {
    if (parseRevenuePaymentHistory(revenue.metadata).length > 0) {
      continue;
    }

    addToChannel(totals, revenue.paymentMethod, revenue.paymentMethod, decimalToNumber(revenue.paidAmount));
  }

  return totals;
}

async function loadExpenseDisbursementsByChannel(): Promise<Record<TreasuryChannelKey, number>> {
  const totals = createEmptyChannelTotals();

  const expenses = await prisma.transaction.findMany({
    where: {
      ...ACTIVE_EXPENSE_WHERE,
      paidAmount: { gt: 0 },
      paymentMethod: { not: null },
    },
    select: {
      paymentMethod: true,
      paidAmount: true,
    },
  });

  for (const expense of expenses) {
    if (!expense.paymentMethod) {
      continue;
    }

    addToChannel(totals, expense.paymentMethod, expense.paymentMethod, -decimalToNumber(expense.paidAmount));
  }

  return totals;
}

/** Trésorerie nette globale ventilée par canal de paiement. */
export async function loadTreasuryByChannel(): Promise<TreasuryChannelBalance[]> {
  const [revenueTotals, expenseTotals] = await Promise.all([
    loadRevenueCollectionsByChannel(),
    loadExpenseDisbursementsByChannel(),
  ]);

  return TREASURY_CHANNEL_ORDER.map((channel) => ({
    channel,
    label: PAYMENT_METHOD_LABELS[channel],
    net: roundMoney(revenueTotals[channel] + expenseTotals[channel]),
  }));
}
