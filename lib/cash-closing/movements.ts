import { format } from "date-fns";

import type { PaymentMethod } from "@prisma/client";

import { parseRevenuePaymentHistory } from "@/lib/revenues/payment-history";

export type MovementBuckets = {
  netCash: number;
  netMobileMoney: number;
  netBankTransfer: number;
  netOther: number;
  liquidMovementCount: number;
  otherMovementCount: number;
};

export function createEmptyMovementBuckets(): MovementBuckets {
  return {
    netCash: 0,
    netMobileMoney: 0,
    netBankTransfer: 0,
    netOther: 0,
    liquidMovementCount: 0,
    otherMovementCount: 0,
  };
}

export function getCalendarDayKey(value: string | Date): string | null {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, "yyyy-MM-dd");
}

export function isWithinClosingDay(value: string | Date, closingDate: string): boolean {
  const dayKey = getCalendarDayKey(value);

  return dayKey !== null && dayKey === closingDate;
}

export function addSignedMovement(
  buckets: MovementBuckets,
  paymentMethod: PaymentMethod | null | undefined,
  signedAmount: number
): void {
  if (signedAmount === 0 || !paymentMethod) {
    return;
  }

  switch (paymentMethod) {
    case "CASH":
      buckets.netCash += signedAmount;
      buckets.liquidMovementCount += 1;
      break;
    case "MOBILE_MONEY":
      buckets.netMobileMoney += signedAmount;
      buckets.liquidMovementCount += 1;
      break;
    case "VIREMENT_BANCAIRE":
      buckets.netBankTransfer += signedAmount;
      buckets.otherMovementCount += 1;
      break;
    case "AUTRE":
      buckets.netOther += signedAmount;
      buckets.otherMovementCount += 1;
      break;
  }
}

/** Ajoute un encaissement revenu du jour. */
export function accumulateRevenuePayment(
  buckets: MovementBuckets,
  payment: {
    amount: number;
    paymentMethod: PaymentMethod | null;
    fallbackPaymentMethod: PaymentMethod | null;
  }
): void {
  addSignedMovement(
    buckets,
    payment.paymentMethod ?? payment.fallbackPaymentMethod,
    payment.amount
  );
}

/** @deprecated Conservé pour les tests ou repli manuel. */
export function accumulateRevenueMovements(
  buckets: MovementBuckets,
  input: {
    metadata: unknown;
    paymentMethod: PaymentMethod | null;
    paidAmount: number;
    createdAt: Date;
  },
  closingDate: string
): void {
  const history = parseRevenuePaymentHistory(input.metadata);

  if (history.length > 0) {
    for (const entry of history) {
      if (entry.amount <= 0 || !isWithinClosingDay(entry.recordedAt, closingDate)) {
        continue;
      }

      addSignedMovement(buckets, entry.paymentMethod ?? input.paymentMethod, entry.amount);
    }

    return;
  }

  if (input.paidAmount > 0 && isWithinClosingDay(input.createdAt, closingDate)) {
    addSignedMovement(buckets, input.paymentMethod, input.paidAmount);
  }
}

/** Soustrait une dépense liquide déjà filtrée sur le jour de clôture. */
export function accumulateExpensePayment(
  buckets: MovementBuckets,
  payment: {
    amount: number;
    paymentMethod: PaymentMethod;
  }
): void {
  addSignedMovement(buckets, payment.paymentMethod, -payment.amount);
}

/** Soustrait une dépense liquide enregistrée le jour de clôture. */
export function accumulateExpenseMovement(
  buckets: MovementBuckets,
  input: {
    paymentMethod: PaymentMethod | null;
    paidAmount: number;
    createdAt: Date;
  },
  closingDate: string
): void {
  if (
    input.paidAmount <= 0 ||
    !input.paymentMethod ||
    !isWithinClosingDay(input.createdAt, closingDate)
  ) {
    return;
  }

  addSignedMovement(buckets, input.paymentMethod, -input.paidAmount);
}
