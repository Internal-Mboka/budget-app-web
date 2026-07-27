"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  initializeFiscalPeriodFormAction,
  type FiscalPeriodSetupFormState,
} from "@/lib/actions/fiscal-period-setup";
import {
  computeFiscalPeriodEndDate,
  normalizeFiscalPeriodStartDate,
} from "@/lib/fiscal-period/dates";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FiscalPeriodSetupPanelProps = {
  defaultStartDate: string;
};

function formatPreviewDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMMM yyyy", { locale: fr });
}

export function FiscalPeriodSetupPanel({ defaultStartDate }: FiscalPeriodSetupPanelProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [skipOpeningBalance, setSkipOpeningBalance] = useState(true);
  const [state, formAction, isPending] = useActionState<FiscalPeriodSetupFormState, FormData>(
    initializeFiscalPeriodFormAction,
    null
  );

  const endDatePreview = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return null;
    }

    const end = computeFiscalPeriodEndDate(normalizeFiscalPeriodStartDate(parseISO(`${startDate}T12:00:00`)));
    return format(end, "yyyy-MM-dd");
  }, [startDate]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")} data-testid="fiscal-period-setup-panel">
      <div className="flex items-start gap-3">
        <CalendarRange className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Paramètres du trimestre</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Le trimestre Mboka dure 3 mois calendaires (date de fin incluse). Vous pourrez clôturer et enchaîner
            les périodes suivantes plus tard.
          </p>
        </div>
      </div>

      {state?.success === false ? (
        <p
          className="rounded-2xl border border-red-100 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
          data-testid="fiscal-period-setup-error"
        >
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="space-y-6">
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="startDate" className={mbokaLabelClassName}>
              Date de début du T1
            </FieldLabel>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={mbokaFieldClassName}
              data-testid="fiscal-period-setup-start-date"
            />
          </Field>
          <Field>
            <FieldLabel className={mbokaLabelClassName}>Fin calculée (3 mois − 1 jour)</FieldLabel>
            <p
              className="rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm font-medium text-[#10579F] dark:border-sky-900 dark:bg-slate-800/60 dark:text-sky-100"
              data-testid="fiscal-period-setup-end-preview"
            >
              {endDatePreview ? formatPreviewDate(`${endDatePreview}T12:00:00`) : "—"}
            </p>
          </Field>
        </FieldGroup>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/40 p-4 dark:border-sky-900 dark:bg-slate-900/40">
          <input
            type="checkbox"
            name="skipOpeningBalance"
            checked={skipOpeningBalance}
            onChange={(event) => setSkipOpeningBalance(event.target.checked)}
            className="mt-1 size-4 rounded border-sky-200 text-[#10579F]"
            data-testid="fiscal-period-setup-skip-opening"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-[#10579F] dark:text-sky-50">
              Nouveau départ — sans solde initial
            </span>
            <span className="block text-sm text-slate-600 dark:text-slate-300">
              Cochez si le studio repart de zéro sans reporter de trésorerie existante.
            </span>
          </span>
        </label>

        {!skipOpeningBalance ? (
          <FieldGroup className="gap-4 sm:grid sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="openingBalanceCash" className={mbokaLabelClassName}>
                Solde espèces
              </FieldLabel>
              <Input
                id="openingBalanceCash"
                name="openingBalanceCash"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className={mbokaFieldClassName}
                data-testid="fiscal-period-setup-cash"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="openingBalanceMobile" className={mbokaLabelClassName}>
                Solde mobile money
              </FieldLabel>
              <Input
                id="openingBalanceMobile"
                name="openingBalanceMobile"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className={mbokaFieldClassName}
                data-testid="fiscal-period-setup-mobile"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="openingBalanceBank" className={mbokaLabelClassName}>
                Solde banque
              </FieldLabel>
              <Input
                id="openingBalanceBank"
                name="openingBalanceBank"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                className={mbokaFieldClassName}
                data-testid="fiscal-period-setup-bank"
              />
            </Field>
          </FieldGroup>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className={mbokaButtonPrimaryClassName}
            disabled={isPending}
            data-testid="fiscal-period-setup-submit"
          >
            {isPending ? "Initialisation…" : "Ouvrir le 1er trimestre"}
          </button>
          <Link href="/dashboard" className={cn(mbokaButtonOutlineClassName, "no-underline")}>
            Retour
          </Link>
        </div>
      </form>
    </section>
  );
}
