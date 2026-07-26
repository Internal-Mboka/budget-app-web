"use client";

import Link from "next/link";
import type { PaymentStatus } from "@prisma/client";

import { RevenueStatusBadges } from "@/components/molecules/revenue-status-badges";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { formatBookingTimeRange, type RevenueBookingRecord } from "@/lib/revenues/booking";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { getBookingStatusTone } from "@/lib/revenues/conflicts";
import { cn } from "@/lib/utils";

type RevenuesPlanningProps = {
  bookings: RevenueBookingRecord[];
};

function toneClassName(tone: ReturnType<typeof getBookingStatusTone>): string {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50/70 dark:border-emerald-950/40 dark:bg-emerald-950/20";
    case "warning":
      return "border-amber-200 bg-amber-50/70 dark:border-amber-950/40 dark:bg-amber-950/20";
    case "danger":
      return "border-rose-200 bg-rose-50/70 dark:border-rose-950/40 dark:bg-rose-950/20";
    default:
      return "border-sky-100 bg-white/80 dark:border-sky-900 dark:bg-slate-900/50";
  }
}

export function RevenuesPlanning({ bookings }: RevenuesPlanningProps) {
  const grouped = bookings.reduce<Record<string, RevenueBookingRecord[]>>((acc, booking) => {
    const day = booking.startTime.slice(0, 10);
    acc[day] = acc[day] ? [...acc[day], booking] : [booking];
    return acc;
  }, {});

  const days = Object.keys(grouped).sort();

  return (
    <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="revenues-planning">
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-500" /> Soldé
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-amber-500" /> Acompte requis
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-slate-400" /> Devis / autre
        </span>
      </div>

      {days.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Aucune réservation planifiée pour le moment.
        </p>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day} className="space-y-3">
              <h3 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                {new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <div className="space-y-3">
                {grouped[day]?.map((booking) => (
                  <article
                    key={booking.transactionId}
                    data-testid={`planning-booking-${booking.code}`}
                    className={cn("rounded-2xl border px-4 py-3", toneClassName(getBookingStatusTone(booking.status)))}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/revenues/${booking.transactionId}`}
                            className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                          >
                            {booking.code}
                          </Link>
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#10579F] dark:bg-slate-800 dark:text-sky-300">
                            {getRevenueCategoryLabel(booking.revenueCategory)}
                          </span>
                          <RevenueStatusBadges
                            financialStatus={booking.status as PaymentStatus}
                            fulfillment={booking.fulfillment}
                          />
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {booking.resourceLabel} · {formatBookingTimeRange(booking)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {booking.clientName ?? "Client non renseigné"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
