"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MbokaSelect } from "@/components/molecules/mboka-select";
import { formatMoney } from "@/lib/currency";
import type { FinancialExportFilters, FinancialExportRegister } from "@/lib/exports/filters";
import type { RevenuePdfExportItem } from "@/lib/exports/load-financial-register";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FinancialExportsPanelProps = {
  filters: FinancialExportFilters;
  revenueDocuments: RevenuePdfExportItem[];
  revenueDocumentTotal: number;
  exportRowCount: number;
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
  revenueDocumentTotal,
  exportRowCount,
}: FinancialExportsPanelProps) {
  const router = useRouter();
  const registerLabel =
    REGISTER_OPTIONS.find((option) => option.value === filters.register)?.label ?? "Registre";

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")} data-testid="financial-export-filters">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-sky-600 dark:text-sky-400" />
          <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Période et registre</p>
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
                Registre à exporter
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
              Appliquer la période
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
          Génération côté serveur pour la période{" "}
          <span className="font-medium">{formatDisplayDate(`${filters.from}T12:00:00`)}</span>
          {" → "}
          <span className="font-medium">{formatDisplayDate(`${filters.to}T12:00:00`)}</span>
          {" · "}
          <span className="font-medium">{registerLabel}</span>
          {" · "}
          <span className="font-medium">{exportRowCount.toLocaleString("fr-FR")} ligne(s)</span>
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
          Proformas et reçus générés dynamiquement pour les revenus de la période filtrée
          {revenueDocumentTotal > revenueDocuments.length
            ? ` (${revenueDocuments.length} affichés sur ${revenueDocumentTotal})`
            : ` (${revenueDocumentTotal})`}
          .
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
                          (enc. {formatMoney(revenue.paidAmount)})
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
      </section>
    </div>
  );
}
