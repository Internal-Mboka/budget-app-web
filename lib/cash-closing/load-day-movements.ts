import type { PaymentMethod } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { getClosingDayRange } from "@/lib/cash-closing/day-range";
import { parseRevenuePaymentHistory } from "@/lib/revenues/payment-history";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type ClosingDayRevenuePayment = {
  amount: number;
  paymentMethod: PaymentMethod | null;
  fallbackPaymentMethod: PaymentMethod | null;
};

type InstallmentRow = {
  amount: Prisma.Decimal | number | string;
  entryPaymentMethod: string | null;
  fallbackPaymentMethod: string | null;
};

/** Versements échelonnés enregistrés exactement le jour de clôture. */
export async function loadRevenuePaymentsForClosingDay(
  closingDate: string
): Promise<ClosingDayRevenuePayment[]> {
  const { start, end } = getClosingDayRange(closingDate);

  const installmentRows = await prisma.$queryRaw<InstallmentRow[]>(Prisma.sql`
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
    WHERE t.type = 'REVENUE'::"TransactionType"
      AND t.status <> 'LITIGE_ANNULE'::"PaymentStatus"
      AND t."isRecurring" = false
      AND t."approvalStatus" NOT IN ('PENDING'::"ApprovalStatus", 'REJECTED'::"ApprovalStatus")
      AND (entry->>'recordedAt')::timestamptz >= ${start}
      AND (entry->>'recordedAt')::timestamptz <= ${end}
      AND COALESCE((entry->>'amount')::numeric, 0) > 0
  `);

  const payments: ClosingDayRevenuePayment[] = installmentRows.map((row) => ({
    amount: decimalToNumber(row.amount),
    paymentMethod: (row.entryPaymentMethod as PaymentMethod | null) ?? null,
    fallbackPaymentMethod: (row.fallbackPaymentMethod as PaymentMethod | null) ?? null,
  }));

  const legacyCandidates = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      status: { not: "LITIGE_ANNULE" },
      isRecurring: false,
      approvalStatus: { notIn: ["PENDING", "REJECTED"] },
      paidAmount: { gt: 0 },
      paymentMethod: { not: null },
      createdAt: { gte: start, lte: end },
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

    payments.push({
      amount: decimalToNumber(revenue.paidAmount),
      paymentMethod: revenue.paymentMethod,
      fallbackPaymentMethod: revenue.paymentMethod,
    });
  }

  return payments;
}

export type ClosingDayExpensePayment = {
  amount: number;
  paymentMethod: PaymentMethod;
};

/** Dépenses liquides enregistrées le jour de clôture. */
export async function loadExpensePaymentsForClosingDay(
  closingDate: string
): Promise<ClosingDayExpensePayment[]> {
  const { start, end } = getClosingDayRange(closingDate);

  const expenses = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      status: "SOLDE",
      isRecurring: false,
      approvalStatus: { notIn: ["PENDING", "REJECTED"] },
      paymentMethod: { not: null },
      createdAt: { gte: start, lte: end },
    },
    select: {
      paymentMethod: true,
      paidAmount: true,
    },
  });

  return expenses
    .filter((expense): expense is { paymentMethod: PaymentMethod; paidAmount: Prisma.Decimal } =>
      Boolean(expense.paymentMethod)
    )
    .map((expense) => ({
      amount: decimalToNumber(expense.paidAmount),
      paymentMethod: expense.paymentMethod,
    }));
}
