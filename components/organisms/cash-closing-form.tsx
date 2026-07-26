"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createCashClosingFormAction,
  type CashClosingFormState,
} from "@/lib/actions/cash-closing";
import { computeExpectedClosingBalances, describeGapAmount } from "@/lib/cash-closing/expected";
import { computeCashClosingGap } from "@/lib/cash-closing/gap";
import type { TheoreticalCashBalances } from "@/lib/cash-closing/theoretical";
import { formatMoney } from "@/lib/currency";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { cn } from "@/lib/utils";

type CashClosingFormProps = {
  theoretical: TheoreticalCashBalances;
  defaultClosingDate: string;
};

function sanitizePhysicalAmount(value: string): string {
  if (!value) {
    return "";
  }

  const parsed = parseMoneyInput(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "";
  }

  return value.replace(/-/g, "");
}

export function CashClosingForm({ theoretical, defaultClosingDate }: CashClosingFormProps) {
  const handledStateRef = useRef<CashClosingFormState>(null);
  const [state, formAction] = useActionState(createCashClosingFormAction, null);
  const [openingCashInput, setOpeningCashInput] = useState("0");
  const [openingMobileMoneyInput, setOpeningMobileMoneyInput] = useState("0");
  const [realCashInput, setRealCashInput] = useState("");
  const [realMobileMoneyInput, setRealMobileMoneyInput] = useState("");

  useEffect(() => {
    if (!state || state === handledStateRef.current || state.success) {
      return;
    }

    handledStateRef.current = state;
    toast.error(state.error);
  }, [state]);

  const preview = useMemo(() => {
    const openingCash = parseMoneyInput(openingCashInput);
    const openingMobileMoney = parseMoneyInput(openingMobileMoneyInput);
    const realCash = parseMoneyInput(realCashInput);
    const realMobileMoney = parseMoneyInput(realMobileMoneyInput);

    if (
      !Number.isFinite(openingCash) ||
      !Number.isFinite(openingMobileMoney) ||
      !Number.isFinite(realCash) ||
      !Number.isFinite(realMobileMoney) ||
      openingCash < 0 ||
      openingMobileMoney < 0 ||
      realCash < 0 ||
      realMobileMoney < 0
    ) {
      return null;
    }

    const expected = computeExpectedClosingBalances({
      openingCash,
      openingMobileMoney,
      netCash: theoretical.theoreticalCash,
      netMobileMoney: theoretical.theoreticalMobileMoney,
    });

    const gap = computeCashClosingGap({
      expectedCash: expected.expectedCash,
      expectedMobileMoney: expected.expectedMobileMoney,
      realCash,
      realMobileMoney,
    });

    return {
      expected,
      gap,
      gapKind: describeGapAmount(gap.gapAmount),
    };
  }, [
    openingCashInput,
    openingMobileMoneyInput,
    realCashInput,
    realMobileMoneyInput,
    theoretical.theoreticalCash,
    theoretical.theoreticalMobileMoney,
  ]);

  const needsOpeningHint =
    theoretical.theoreticalCash < 0 || theoretical.theoreticalMobileMoney < 0;

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")} data-testid="cash-closing-form">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
          <Calculator className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Comptage de fin de journée</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comparez le comptage physique au solde attendu (fond de caisse + mouvements du jour).
          </p>
        </div>
      </div>

      <div
        className="grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:grid-cols-2 dark:border-sky-900 dark:bg-sky-950/20"
        data-testid="cash-closing-theoretical-panel"
      >
        <div>
          <p className={mbokaLabelClassName}>Mouvement net espèces (jour)</p>
          <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="cash-closing-theoretical-cash">
            {formatMoney(theoretical.theoreticalCash)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Entrées − sorties en espèces ({theoretical.transactionCount} transaction
            {theoretical.transactionCount > 1 ? "s" : ""})
          </p>
        </div>
        <div>
          <p className={mbokaLabelClassName}>Mouvement net Mobile Money (jour)</p>
          <p
            className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50"
            data-testid="cash-closing-theoretical-mobile"
          >
            {formatMoney(theoretical.theoreticalMobileMoney)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Entrées − sorties mobile money</p>
        </div>
      </div>

      {needsOpeningHint ? (
        <p
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
          data-testid="cash-closing-opening-hint"
        >
          Mouvement net négatif ce jour — renseignez le <strong>fond de caisse initial</strong> pour obtenir le
          solde attendu à comparer avec votre comptage physique.
        </p>
      ) : null}

      <form action={formAction} className="space-y-6">
        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="closingDate" className={mbokaLabelClassName}>
                Date de clôture *
              </FieldLabel>
              <Input
                id="closingDate"
                name="closingDate"
                type="date"
                required
                defaultValue={defaultClosingDate}
                className={mbokaFieldClassName}
              />
            </Field>

            <div className="space-y-3">
              <p className="text-sm font-medium text-[#10579F] dark:text-sky-50">Fond de caisse (début de journée)</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="openingCash" className={mbokaLabelClassName}>
                    Espèces en caisse au départ
                  </FieldLabel>
                  <Input
                    id="openingCash"
                    name="openingCash"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={openingCashInput}
                    onChange={(event) => setOpeningCashInput(sanitizePhysicalAmount(event.target.value))}
                    className={mbokaFieldClassName}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Monnaie / billets présents avant les opérations du jour.
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="openingMobileMoney" className={mbokaLabelClassName}>
                    Solde Mobile Money au départ
                  </FieldLabel>
                  <Input
                    id="openingMobileMoney"
                    name="openingMobileMoney"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={openingMobileMoneyInput}
                    onChange={(event) => setOpeningMobileMoneyInput(sanitizePhysicalAmount(event.target.value))}
                    className={mbokaFieldClassName}
                  />
                </Field>
              </div>
            </div>

            {preview ? (
              <div
                className="grid gap-4 rounded-2xl border border-[#10579F]/15 bg-[#10579F]/5 p-4 sm:grid-cols-2 dark:border-sky-900 dark:bg-sky-950/20"
                data-testid="cash-closing-expected-panel"
              >
                <div>
                  <p className={mbokaLabelClassName}>Solde espèces attendu</p>
                  <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50">
                    {formatMoney(preview.expected.expectedCash)}
                  </p>
                </div>
                <div>
                  <p className={mbokaLabelClassName}>Solde Mobile Money attendu</p>
                  <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50">
                    {formatMoney(preview.expected.expectedMobileMoney)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm font-medium text-[#10579F] dark:text-sky-50">Comptage physique (fin de journée)</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="realCash" className={mbokaLabelClassName}>
                    Espèces comptées *
                  </FieldLabel>
                  <Input
                    id="realCash"
                    name="realCash"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={realCashInput}
                    onChange={(event) => setRealCashInput(sanitizePhysicalAmount(event.target.value))}
                    className={mbokaFieldClassName}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Montant réellement présent dans le tiroir-caisse (toujours positif ou zéro).
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="realMobileMoney" className={mbokaLabelClassName}>
                    Mobile Money compté *
                  </FieldLabel>
                  <Input
                    id="realMobileMoney"
                    name="realMobileMoney"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={realMobileMoneyInput}
                    onChange={(event) => setRealMobileMoneyInput(sanitizePhysicalAmount(event.target.value))}
                    className={mbokaFieldClassName}
                  />
                </Field>
              </div>
            </div>
          </FieldGroup>

          {preview ? (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                preview.gap.hasDiscrepancy
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
              )}
              data-testid="cash-closing-gap-preview"
            >
              Écart (compté − attendu) :{" "}
              <span className="font-semibold" data-testid="cash-closing-gap-amount">
                {formatMoney(preview.gap.gapAmount)}
              </span>
              {preview.gapKind === "balanced"
                ? " — caisse conforme"
                : preview.gapKind === "overage"
                  ? " — surplus détecté"
                  : " — manque détecté"}
            </div>
          ) : null}

          <MbokaSubmitButton testId="cash-closing-submit" pendingLabel="Clôture...">
            Valider la clôture de caisse
          </MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
