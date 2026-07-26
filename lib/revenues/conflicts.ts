import type { PaymentStatus, RevenueCategory } from "@prisma/client";

import {
  bookingIntervalsOverlap,
  parseBookingFromMetadata,
  type RevenueBookingRecord,
  type RevenueBookingSlot,
} from "@/lib/revenues/booking";
import { parseRevenueFulfillment } from "@/lib/revenues/fulfillment";
import { prisma } from "@/lib/prisma";

export type BookingConflict = {
  code: string;
  resourceLabel: string;
  message: string;
};

export async function findRevenueBookingConflict(
  revenueCategory: RevenueCategory,
  metadata: unknown,
  excludeTransactionId?: string
): Promise<BookingConflict | null> {
  const candidate = parseBookingFromMetadata(revenueCategory, metadata);

  if (!candidate) {
    return null;
  }

  if (revenueCategory !== "STUDIO_SESSION" && revenueCategory !== "LOCATION_VEHICULE") {
    return null;
  }

  const existing = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      revenueCategory,
      status: { not: "LITIGE_ANNULE" },
      ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
    },
    select: {
      id: true,
      code: true,
      metadata: true,
      revenueCategory: true,
      status: true,
    },
  });

  for (const transaction of existing) {
    const slot = parseBookingFromMetadata(transaction.revenueCategory!, transaction.metadata);

    if (!slot) {
      continue;
    }

    if (bookingIntervalsOverlap(candidate, slot)) {
      return {
        code: transaction.code,
        resourceLabel: slot.resourceLabel,
        message: `Créneau déjà occupé sur ${slot.resourceLabel} par la réservation ${transaction.code}.`,
      };
    }
  }

  return null;
}

export function mapTransactionsToBookingRecords(
  transactions: Array<{
    id: string;
    code: string;
    status: PaymentStatus;
    revenueCategory: RevenueCategory | null;
    metadata: unknown;
    client: { name: string } | null;
  }>
) {
  return transactions
    .map((transaction) => {
      if (!transaction.revenueCategory) {
        return null;
      }

      const slot = parseBookingFromMetadata(transaction.revenueCategory, transaction.metadata);

      if (!slot) {
        return null;
      }

      return {
        transactionId: transaction.id,
        code: transaction.code,
        status: transaction.status,
        clientName: transaction.client?.name ?? null,
        revenueCategory: transaction.revenueCategory,
        fulfillment: parseRevenueFulfillment(transaction.metadata),
        ...slot,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function getBookingStatusTone(status: PaymentStatus): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "SOLDE":
      return "success";
    case "LITIGE_ANNULE":
      return "danger";
    case "RESERVE_ACOMPTE_REQUIS":
      return "warning";
    default:
      return "neutral";
  }
}

export type { RevenueBookingSlot };
