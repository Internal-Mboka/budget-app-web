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

export function isWithinClosingDay(isoDate: string | Date, start: Date, end: Date): boolean {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date >= start && date <= end;
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

/** Ventile les encaissements revenus du jour (historique de versements ou repli legacy). */
export function accumulateRevenueMovements(
  buckets: MovementBuckets,
  input: {
    metadata: unknown;
    paymentMethod: PaymentMethod | null;
    paidAmount: number;
    createdAt: Date;
  },
  start: Date,
  end: Date
): void {
  const history = parseRevenuePaymentHistory(input.metadata);

  if (history.length > 0) {
    for (const entry of history) {
      if (entry.amount <= 0 || !isWithinClosingDay(entry.recordedAt, start, end)) {
        continue;
      }

      addSignedMovement(buckets, entry.paymentMethod ?? input.paymentMethod, entry.amount);
    }

    return;
  }

  if (input.paidAmount > 0 && isWithinClosingDay(input.createdAt, start, end)) {
    addSignedMovement(buckets, input.paymentMethod, input.paidAmount);
  }
}

/** Soustrait une dépense liquide enregistrée le jour de clôture. */
export function accumulateExpenseMovement(
  buckets: MovementBuckets,
  input: {
    paymentMethod: PaymentMethod | null;
    paidAmount: number;
    createdAt: Date;
  },
  start: Date,
  end: Date
): void {
  if (
    input.paidAmount <= 0 ||
    !input.paymentMethod ||
    !isWithinClosingDay(input.createdAt, start, end)
  ) {
    return;
  }

  addSignedMovement(buckets, input.paymentMethod, -input.paidAmount);
}
