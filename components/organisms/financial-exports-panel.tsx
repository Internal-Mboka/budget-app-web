"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, FileSpreadsheet, FileText, Lock, Scale } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { MbokaSelect } from "@/components/molecules/mboka-select";
import { formatMoney } from "@/lib/currency";
import type { FinancialExportFilters, FinancialExportRegister } from "@/lib/exports/filters";
import { buildExportsListHref } from "@/lib/exports/list-url";
import type { RevenuePdfExportItem } from "@/lib/exports/load-financial-register";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { isFullCivilMonthPeriod } from "@/lib/period-closure/dates";
import type { FinancialPeriodClosureRecord } from "@/lib/period-closure/load-closures";
import type { PaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type FinancialExportsPanelProps = {
  filters: FinancialExportFilters;
  revenueDocuments: RevenuePdfExportItem[];
  revenueDocumentsPagination: PaginationMeta;
  exportRowCount: number;
  periodClosure: FinancialPeriodClosureRecord | null;
  canClosePeriod: boolean;
  closureError?: string;
};

const REGISTER_OPTIONS: Array<{ value: FinancialExportRegister; label: string }> = [
  { value: "revenues", label: "Registre des revenus" },
  { value: "expenses", label: "Registre des dépenses" },
  { value: "journal", label: "Journal comptable (revenus + dépenses)" },
];

function buildCsvExportHref(filters: FinancialExportFilters): string {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    register: filters.register,
  });

  return `/api/exports/financial?${params.toString()}`;
}

function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy", { locale: fr });
}

export function FinancialExportsPanel({
  filters,
  revenueDocuments,
  revenueDocumentsPagination,
  exportRowCount,
  periodClosure,
  canClosePeriod,
  closureError,
}: FinancialExportsPanelProps) {
  const router = useRouter();
  const registerLabel =
    REGISTER_OPTIONS.find((option) => option.value === filters.register)?.label ?? "Registre";
  const isFullMonth = isFullCivilMonthPeriod(filters);

  function buildListHref(page: number, pageSize?: number) {
    return buildExportsListHref({
      page,
      pageSize: pageSize ?? revenueDocumentsPagination.pageSize,
      from: filters.from,
      to: filters.to,
      register: filters.register,
    });
  }

  function buildPeriodBalancePdfHref(preview = false) {
    const params = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });

    if (preview) {
      params.set("preview", "1");
    }

    return `/api/exports/period-balance/pdf?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")} data-testid="financial-export-filters">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-sky-600 dark:text-sky-400" />
          <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Choisir la période</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const params = new URLSearchParams();

            for (const key of ["from", "to", "register"] as const) {
              const value = String(formData.get(key) ?? "").trim();

              if (value) {
                params.set(key, value);
              }
            }

            const query = params.toString();
            router.push(query ? `/exports?${query}` : "/exports");
          }}
        >
          <FieldGroup className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="from" className={mbokaLabelClassName}>
                Du
              </FieldLabel>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={filters.from}
                className={mbokaFieldClassName}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="to" className={mbokaLabelClassName}>
                Au
              </FieldLabel>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={filters.to}
                className={mbokaFieldClassName}
                required
              />
            </Field>
            <Field className="sm:col-span-2 lg:col-span-1">
              <FieldLabel htmlFor="register" className={mbokaLabelClassName}>
                Contenu à exporter
              </FieldLabel>
              <MbokaSelect
                id="register"
                name="register"
                defaultValue={filters.register}
                options={REGISTER_OPTIONS}
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className={mbokaButtonOutlineClassName} data-testid="financial-export-apply">
              Afficher
            </button>
            <Link href="/exports" className={mbokaButtonOutlineClassName}>
              Réinitialiser
            </Link>
          </div>
        </form>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")} data-testid="financial-export-csv">
        <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Export CSV</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">{registerLabel}</span>
          {" · du "}
          <span className="font-medium">{formatDisplayDate(`${filters.from}T12:00:00`)}</span>
          {" au "}
          <span className="font-medium">{formatDisplayDate(`${filters.to}T12:00:00`)}</span>
          {" · "}
          <span className="font-medium">
            {exportRowCount.toLocaleString("fr-FR")}{" "}
            {exportRowCount > 1 ? "entrées" : "entrée"}
          </span>
          .
        </p>
        <a
          href={buildCsvExportHref(filters)}
          className={cn(mbokaButtonPrimaryClassName, "inline-flex no-underline")}
          data-testid="financial-export-csv-download"
        >
          <Download className="size-4" />
          Télécharger le CSV
        </a>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")} data-testid="financial-export-pdf">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-sky-600 dark:text-sky-400" />
          <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Factures & reçus PDF</p>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">
            {revenueDocumentsPagination.total.toLocaleString("fr-FR")}{" "}
            {revenueDocumentsPagination.total > 1 ? "revenus" : "revenu"}
          </span>
          {" sur cette période — téléchargez la proforma ou le reçu de chaque opération."}
        </p>

        {revenueDocuments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun revenu sur cette période.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sky-100 dark:border-sky-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-sky-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Code</th>
                  <th className="px-3 py-2.5 font-medium">Client</th>
                  <th className="px-3 py-2.5 font-medium">Montant</th>
                  <th className="px-3 py-2.5 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 dark:divide-sky-900">
                {revenueDocuments.map((revenue) => (
                  <tr key={revenue.id} data-testid={`financial-export-pdf-row-${revenue.code}`}>
                    <td className="px-3 py-2.5 font-medium text-[#10579F] dark:text-sky-50">
                      <Link href={`/revenues/${revenue.id}`} className="hover:underline">
                        {revenue.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{revenue.clientName}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700 dark:text-slate-200">
                      {formatMoney(revenue.totalAmount)}
                      {revenue.paidAmount > 0 ? (
                        <span className="ml-1 text-xs text-slate-500">
                          (dont {formatMoney(revenue.paidAmount)} encaissé)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/api/revenues/${revenue.id}/pdf?type=proforma`}
                          className={cn(mbokaButtonOutlineClassName, "px-3 py-1.5 text-xs")}
                          data-testid={`financial-export-pdf-proforma-${revenue.code}`}
                        >
                          Proforma
                        </a>
                        {revenue.paidAmount > 0 ? (
                          <a
                            href={`/api/revenues/${revenue.id}/pdf?type=receipt`}
                            className={cn(mbokaButtonOutlineClassName, "px-3 py-1.5 text-xs")}
                            data-testid={`financial-export-pdf-receipt-${revenue.code}`}
                          >
                            Reçu
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <MbokaPagination meta={revenueDocumentsPagination} buildHref={buildListHref} />
      </section>

      {isFullMonth ? (
        <section
          className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")}
          data-testid="financial-export-period-balance"
        >
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-sky-600 dark:text-sky-400" />
            <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Bilan périodique PDF</p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            Récapitulatif mensuel du{" "}
            <span className="font-medium">{formatDisplayDate(`${filters.from}T12:00:00`)}</span>
            {" au "}
            <span className="font-medium">{formatDisplayDate(`${filters.to}T12:00:00`)}</span>
            {" : revenus, dépenses, avoirs et solde net."}
          </p>

          {closureError ? (
            <p
              className="rounded-2xl border border-red-100 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
              data-testid="financial-export-period-balance-error"
              role="alert"
            >
              {closureError}
            </p>
          ) : null}

          {periodClosure ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <Lock className="size-4 shrink-0" />
              <span>
                Période clôturée le{" "}
                {format(parseISO(periodClosure.closedAt), "d MMM yyyy HH:mm", { locale: fr })}
                {" · "}
                {periodClosure.documentCode}
              </span>
            </div>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Ce mois n&apos;est pas encore clôturé. Après clôture, seuls le PDG et le DT pourront
              modifier les opérations passées.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!periodClosure ? (
              <>
                <a
                  href={buildPeriodBalancePdfHref(true)}
                  className={cn(mbokaButtonOutlineClassName, "inline-flex no-underline")}
                  data-testid="financial-export-period-balance-preview"
                >
                  <Download className="size-4" />
                  Aperçu avant clôture
                </a>

                {canClosePeriod ? (
                  <form action="/api/exports/period-balance/close" method="post">
                    <input type="hidden" name="from" value={filters.from} />
                    <input type="hidden" name="to" value={filters.to} />
                    <button
                      type="submit"
                      className={cn(
                        mbokaButtonPrimaryClassName,
                        "border-amber-200 text-amber-900 dark:border-amber-900 dark:text-amber-100"
                      )}
                      data-testid="financial-export-period-balance-close"
                      onClick={(event) => {
                        const confirmed = window.confirm(
                          "Clôturer ce mois ? Les modifications rétroactives seront réservées au PDG et au DT."
                        );

                        if (!confirmed) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <Lock className="size-4" />
                      Clôturer le mois
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <a
                href={buildPeriodBalancePdfHref(false)}
                className={cn(mbokaButtonPrimaryClassName, "inline-flex no-underline")}
                data-testid="financial-export-period-balance-download"
              >
                <Download className="size-4" />
                Télécharger le bilan archivé
              </a>
            )}
          </div>
        </section>
      ) : (
        <section
          className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")}
          data-testid="financial-export-period-balance-hint"
        >
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-sky-600 dark:text-sky-400" />
            <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Bilan périodique PDF</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pour générer ou clôturer le bilan mensuel, sélectionnez un{" "}
            <span className="font-medium">mois civil complet</span> — du 1<sup>er</sup> au dernier jour
            du même mois.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Période actuelle : du {formatDisplayDate(`${filters.from}T12:00:00`)} au{" "}
            {formatDisplayDate(`${filters.to}T12:00:00`)}.
          </p>
        </section>
      )}
    </div>
  );
}
