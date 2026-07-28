import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { PaymentMethod } from "@prisma/client";

import { formatClosingDateInput } from "@/lib/cash-closing/day-range";
import { computeExpectedClosingBalances } from "@/lib/cash-closing/expected";
import { computeCashClosingGap } from "@/lib/cash-closing/gap";
import {
  loadExpensePaymentsForClosingDay,
  loadRevenuePaymentsForClosingDay,
} from "@/lib/cash-closing/load-day-movements";
import type { CashClosingPdfData } from "@/lib/cash-closing/pdf/types";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

function resolveRevenuePaymentMethod(payment: {
  paymentMethod: PaymentMethod | null;
  fallbackPaymentMethod: PaymentMethod | null;
}): PaymentMethod | null {
  return payment.paymentMethod ?? payment.fallbackPaymentMethod;
}

function sumByMethod(
  payments: Array<{ amount: number; method: PaymentMethod | null }>,
  method: PaymentMethod
): number {
  return payments
    .filter((payment) => payment.method === method)
    .reduce((total, payment) => total + payment.amount, 0);
}

export async function loadCashClosingPdfData(id: string): Promise<CashClosingPdfData | null> {
  const closing = await prisma.cashClosing.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      theoreticalCash: true,
      theoreticalMobileMoney: true,
      openingCash: true,
      openingMobileMoney: true,
      realCash: true,
      realMobileMoney: true,
      gapAmount: true,
      hasDiscrepancy: true,
      notes: true,
      createdAt: true,
      operator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!closing) {
    return null;
  }

  const closingDate = formatClosingDateInput(new Date(closing.date));
  const openingCash = decimalToNumber(closing.openingCash);
  const openingMobileMoney = decimalToNumber(closing.openingMobileMoney);
  const realCash = decimalToNumber(closing.realCash);
  const realMobileMoney = decimalToNumber(closing.realMobileMoney);
  const netCash = decimalToNumber(closing.theoreticalCash);
  const netMobileMoney = decimalToNumber(closing.theoreticalMobileMoney);

  const [revenuePayments, expensePayments] = await Promise.all([
    loadRevenuePaymentsForClosingDay(closingDate),
    loadExpensePaymentsForClosingDay(closingDate),
  ]);

  const revenueRows = revenuePayments.map((payment) => ({
    amount: payment.amount,
    method: resolveRevenuePaymentMethod(payment),
  }));

  const expenseRows = expensePayments.map((payment) => ({
    amount: payment.amount,
    method: payment.paymentMethod,
  }));

  const cashRevenues = sumByMethod(revenueRows, "CASH");
  const mobileRevenues = sumByMethod(revenueRows, "MOBILE_MONEY");
  const cashExpenses = sumByMethod(expenseRows, "CASH");
  const mobileExpenses = sumByMethod(expenseRows, "MOBILE_MONEY");

  const expected = computeExpectedClosingBalances({
    openingCash,
    openingMobileMoney,
    netCash,
    netMobileMoney,
  });

  const gap = computeCashClosingGap({
    expectedCash: expected.expectedCash,
    expectedMobileMoney: expected.expectedMobileMoney,
    realCash,
    realMobileMoney,
  });

  return {
    id: closing.id,
    closingDate,
    closingDateLabel: format(parseISO(`${closingDate}T12:00:00`), "d MMMM yyyy", { locale: fr }),
    operatorName: `${closing.operator.firstName} ${closing.operator.lastName}`.trim(),
    openingCash,
    openingMobileMoney,
    cashRevenues,
    mobileRevenues,
    cashExpenses,
    mobileExpenses,
    expectedCash: expected.expectedCash,
    expectedMobileMoney: expected.expectedMobileMoney,
    realCash,
    realMobileMoney,
    gapCash: gap.gapCash,
    gapMobileMoney: gap.gapMobileMoney,
    gapAmount: decimalToNumber(closing.gapAmount),
    hasDiscrepancy: closing.hasDiscrepancy,
    notes: closing.notes,
    issuedAt: closing.createdAt.toISOString(),
  };
}
