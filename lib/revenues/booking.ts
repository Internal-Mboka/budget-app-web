import type { PaymentStatus, RevenueCategory } from "@prisma/client";

import type { RevenueFulfillmentMetadata } from "@/lib/revenues/fulfillment";
import { addDays, addHours, parseISO } from "date-fns";

import type {
  StudioRevenueMetadata,
  VehicleRevenueMetadata,
} from "@/lib/revenues/metadata";

export type RevenueBookingSlot = {
  resourceId: string;
  resourceLabel: string;
  startTime: string;
  endTime: string;
};

export type RevenueBookingRecord = RevenueBookingSlot & {
  transactionId: string;
  code: string;
  status: PaymentStatus;
  clientName: string | null;
  revenueCategory: RevenueCategory;
  fulfillment?: RevenueFulfillmentMetadata | null;
};

type BookingMetadata = {
  resourceId?: string;
  resourceLabel?: string;
  startTime?: string;
  endTime?: string;
  studioRoom?: string;
  durationHours?: number;
  vehiclePlate?: string;
  days?: number;
};

function combineDateAndTime(dateValue: string, timeValue: string): Date {
  return new Date(`${dateValue}T${timeValue}:00`);
}

export function buildStudioBookingSlot(input: {
  studioRoom: string;
  durationHours: number;
  sessionDate: string;
  sessionStartTime?: string;
}): RevenueBookingSlot {
  const start = combineDateAndTime(input.sessionDate, input.sessionStartTime ?? "09:00");
  const end = addHours(start, input.durationHours);

  return {
    resourceId: `studio-room-${input.studioRoom}`,
    resourceLabel: `Salle ${input.studioRoom}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export function buildVehicleBookingSlot(input: {
  vehiclePlate: string;
  days: number;
  rentalStartDate: string;
  rentalStartTime?: string;
}): RevenueBookingSlot {
  const start = combineDateAndTime(input.rentalStartDate, input.rentalStartTime ?? "08:00");
  const end = addDays(start, input.days);

  return {
    resourceId: `vehicle-${input.vehiclePlate.trim().toUpperCase()}`,
    resourceLabel: input.vehiclePlate.trim().toUpperCase(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export function enrichStudioMetadata(
  metadata: StudioRevenueMetadata,
  sessionDate: string,
  sessionStartTime?: string
) {
  const booking = buildStudioBookingSlot({
    studioRoom: metadata.studioRoom,
    durationHours: metadata.durationHours,
    sessionDate,
    sessionStartTime,
  });

  return {
    ...metadata,
    sessionDate,
    sessionStartTime: sessionStartTime ?? "09:00",
    ...booking,
  };
}

export function enrichVehicleMetadata(
  metadata: VehicleRevenueMetadata,
  rentalStartDate: string,
  rentalStartTime?: string
) {
  const booking = buildVehicleBookingSlot({
    vehiclePlate: metadata.vehiclePlate,
    days: metadata.days,
    rentalStartDate,
    rentalStartTime,
  });

  return {
    ...metadata,
    rentalStartDate,
    rentalStartTime: rentalStartTime ?? "08:00",
    ...booking,
  };
}

export function parseBookingFromMetadata(
  revenueCategory: RevenueCategory,
  metadata: unknown
): RevenueBookingSlot | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as BookingMetadata;

  if (record.startTime && record.endTime && record.resourceId) {
    return {
      resourceId: record.resourceId,
      resourceLabel: record.resourceLabel ?? record.resourceId,
      startTime: record.startTime,
      endTime: record.endTime,
    };
  }

  if (revenueCategory === "STUDIO_SESSION" && record.studioRoom && record.durationHours) {
    const sessionDate = String((record as BookingMetadata & { sessionDate?: string }).sessionDate ?? "");
    if (!sessionDate) {
      return null;
    }

    return buildStudioBookingSlot({
      studioRoom: record.studioRoom,
      durationHours: Number(record.durationHours),
      sessionDate,
      sessionStartTime: String(
        (record as BookingMetadata & { sessionStartTime?: string }).sessionStartTime ?? "09:00"
      ),
    });
  }

  if (revenueCategory === "LOCATION_VEHICULE" && record.vehiclePlate && record.days) {
    const rentalStartDate = String(
      (record as BookingMetadata & { rentalStartDate?: string }).rentalStartDate ?? ""
    );
    if (!rentalStartDate) {
      return null;
    }

    return buildVehicleBookingSlot({
      vehiclePlate: record.vehiclePlate,
      days: Number(record.days),
      rentalStartDate,
      rentalStartTime: String(
        (record as BookingMetadata & { rentalStartTime?: string }).rentalStartTime ?? "08:00"
      ),
    });
  }

  return null;
}

export function bookingIntervalsOverlap(
  left: Pick<RevenueBookingSlot, "startTime" | "endTime" | "resourceId">,
  right: Pick<RevenueBookingSlot, "startTime" | "endTime" | "resourceId">
): boolean {
  if (left.resourceId !== right.resourceId) {
    return false;
  }

  const leftStart = parseISO(left.startTime).getTime();
  const leftEnd = parseISO(left.endTime).getTime();
  const rightStart = parseISO(right.startTime).getTime();
  const rightEnd = parseISO(right.endTime).getTime();

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function formatBookingTimeRange(slot: RevenueBookingSlot): string {
  const start = parseISO(slot.startTime);
  const end = parseISO(slot.endTime);
  const date = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const startTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return `${date} · ${startTime} → ${endTime}`;
}
