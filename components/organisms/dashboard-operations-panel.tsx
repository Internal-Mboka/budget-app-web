import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, PlusCircle, Receipt, UsersRound } from "lucide-react";
import Link from "next/link";

import { MbokaKpiCard, MbokaKpiGrid } from "@/components/molecules/mboka-kpi-card";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { OperationsDashboardSnapshot } from "@/lib/dashboard/load-operations-dashboard";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

type DashboardOperationsPanelProps = {
  snapshot: OperationsDashboardSnapshot;
};

export function DashboardOperationsPanel({ snapshot }: DashboardOperationsPanelProps) {
  return (
    <div className="space-y-6">
      <section
        className={cn(mbokaPanelClassName, "p-4 sm:p-5")}
        data-testid="operations-quick-actions"
      >
        <h2 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Actions rapides</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Raccourcis pour la saisie quotidienne des revenus et le suivi client.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/revenues/new"
            className={cn(mbokaButtonPrimaryClassName, "w-full sm:w-auto")}
            data-testid="operations-new-revenue"
          >
            <PlusCircle className="size-4" />
            Nouveau revenu
          </Link>
          <Link
            href="/clients"
            className={cn(mbokaButtonOutlineClassName, "w-full sm:w-auto")}
            data-testid="operations-clients"
          >
            <UsersRound className="size-4" />
            Clients
          </Link>
          <Link
            href="/revenues"
            className={cn(mbokaButtonOutlineClassName, "w-full sm:w-auto")}
            data-testid="operations-revenues"
          >
            <Receipt className="size-4" />
            Registre revenus
          </Link>
          <Link
            href="/revenues/planning"
            className={cn(mbokaButtonOutlineClassName, "w-full sm:w-auto")}
            data-testid="operations-planning"
          >
            <CalendarDays className="size-4" />
            Planning
          </Link>
        </div>
      </section>

      <MbokaKpiGrid>
        <MbokaKpiCard
          label="Revenus saisis aujourd'hui"
          value={snapshot.todayCreatedCount}
          hint={snapshot.todayLabel}
          format="number"
          testId="operations-kpi-today-count"
        />
        <MbokaKpiCard
          label="Montant saisi aujourd'hui"
          value={snapshot.todayCreatedTotal}
          hint={snapshot.todayLabel}
          testId="operations-kpi-today-total"
        />
        <MbokaKpiCard
          label="En attente de paiement"
          value={snapshot.pendingPaymentCount}
          hint="Devis, acomptes ou soldes restants"
          format="number"
          testId="operations-kpi-pending"
        />
        <MbokaKpiCard
          label="Réservations du jour"
          value={snapshot.todayBookingsCount}
          hint="Studio et véhicules"
          format="number"
          testId="operations-kpi-bookings"
        />
      </MbokaKpiGrid>

      <section className="grid gap-6 lg:grid-cols-2">
        <article
          className={cn(mbokaPanelClassName, "flex min-h-[18rem] flex-col p-4 sm:p-5")}
          data-testid="operations-today-bookings"
        >
          <div className="text-center">
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Créneaux du jour
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sessions studio et locations véhicules prévues aujourd&apos;hui.
            </p>
          </div>

          {snapshot.todayBookings.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-300 dark:bg-slate-800 dark:text-sky-700">
                <CalendarDays className="size-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                Aucune réservation prévue aujourd&apos;hui.
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
                Les sessions studio et locations véhicules du jour s&apos;afficheront ici.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {snapshot.todayBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/revenues/${booking.id}`}
                      className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-300"
                    >
                      {booking.code}
                    </Link>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getPaymentStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {booking.resourceLabel}
                    {booking.clientName ? ` · ${booking.clientName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    {format(new Date(booking.startTime), "HH:mm", { locale: fr })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={cn(mbokaPanelClassName, "p-4 sm:p-5")} data-testid="operations-recent-revenues">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
                Dernières saisies
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Les 5 revenus les plus récents du registre.
              </p>
            </div>
            <Link
              href="/revenues"
              className="shrink-0 text-xs font-medium text-[#10579F] hover:underline dark:text-sky-300"
            >
              Tout voir →
            </Link>
          </div>

          {snapshot.recentRevenues.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Aucun revenu enregistré pour le moment.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {snapshot.recentRevenues.map((revenue) => (
                <li
                  key={revenue.id}
                  className="rounded-2xl border border-sky-100 px-4 py-3 dark:border-sky-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/revenues/${revenue.id}`}
                      className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-300"
                    >
                      {revenue.code}
                    </Link>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formatMoney(revenue.totalAmount, {
                        symbol: revenue.currency === "CDF" ? "FC " : "$",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {revenue.revenueCategory
                      ? getRevenueCategoryLabel(revenue.revenueCategory)
                      : "Revenu"}
                    {revenue.clientName ? ` · ${revenue.clientName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    {getPaymentStatusLabel(revenue.status)} ·{" "}
                    {format(new Date(revenue.createdAt), "d MMM yyyy · HH:mm", { locale: fr })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
