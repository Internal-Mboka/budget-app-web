"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Calculator, Info } from "lucide-react";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createCashClosingFormAction,
  type CashClosingFormState,
} from "@/lib/actions/cash-closing";
import { computeExpectedClosingBalances, describeGapAmount } from "@/lib/cash-closing/expected";
import { computeCashClosingGap } from "@/lib/cash-closing/gap";
import type { CashClosingDaySummary } from "@/lib/cash-closing/theoretical";
import { formatMoney } from "@/lib/currency";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { cn } from "@/lib/utils";

type CashClosingFormProps = {
  summary: CashClosingDaySummary;
  defaultClosingDate: string;
};

function sanitizePhysicalAmount(value: string): string {
  return value.replace(/-/g, "");
}

function formatSignedMoney(value: number): string {
  if (value > 0) {
    return `+${formatMoney(value)}`;
  }

  return formatMoney(value);
}

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10579F] text-xs font-semibold text-white dark:bg-sky-600">
        {step}
      </span>
      <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">{label}</p>
    </div>
  );
}

function FormulaLine({
  label,
  opening,
  movement,
  expected,
}: {
  label: string;
  opening: number;
  movement: number;
  expected: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900/40">
      <p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
        <span>{formatMoney(opening)}</span>
        <span className="text-slate-400">+</span>
        <span>{formatSignedMoney(movement)}</span>
        <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
        <span className="font-semibold text-[#10579F] dark:text-sky-50">{formatMoney(expected)}</span>
        <span className="text-xs text-slate-500">attendu</span>
      </p>
    </div>
  );
}

export function CashClosingForm({ summary, defaultClosingDate }: CashClosingFormProps) {
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

  const openingCash = parseMoneyInput(openingCashInput || "0");
  const openingMobileMoney = parseMoneyInput(openingMobileMoneyInput || "0");
  const realCash = realCashInput === "" ? null : parseMoneyInput(realCashInput);
  const realMobileMoney = realMobileMoneyInput === "" ? null : parseMoneyInput(realMobileMoneyInput);

  const expected = useMemo(
    () =>
      computeExpectedClosingBalances({
        openingCash: Number.isFinite(openingCash) ? openingCash : 0,
        openingMobileMoney: Number.isFinite(openingMobileMoney) ? openingMobileMoney : 0,
        netCash: summary.netCash,
        netMobileMoney: summary.netMobileMoney,
      }),
    [openingCash, openingMobileMoney, summary.netCash, summary.netMobileMoney]
  );

  const preview = useMemo(() => {
    if (realCash === null || realMobileMoney === null) {
      return null;
    }

    if (!Number.isFinite(realCash) || !Number.isFinite(realMobileMoney) || realCash < 0 || realMobileMoney < 0) {
      return null;
    }

    const gap = computeCashClosingGap({
      expectedCash: expected.expectedCash,
      expectedMobileMoney: expected.expectedMobileMoney,
      realCash,
      realMobileMoney,
    });

    return {
      gap,
      gapKind: describeGapAmount(gap.gapAmount),
    };
  }, [expected, realCash, realMobileMoney]);

  const hasOtherPayments = summary.otherTransactionCount > 0;

  return (
    <div className="space-y-5">
      <section
        className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-600 dark:border-sky-900 dark:bg-sky-950/20 dark:text-slate-300"
        data-testid="cash-closing-scope-note"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
        <p>
          La clôture concerne uniquement l&apos;<strong>espèce</strong> et le{" "}
          <strong>mobile money</strong> — ce que vous pouvez compter physiquement. Les virements
          bancaires et autres modes sont suivis à part et ne passent pas par la caisse.
        </p>
      </section>

      {hasOtherPayments ? (
        <section
          className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")}
          data-testid="cash-closing-other-payments-panel"
        >
          <p className={mbokaLabelClassName}>Autres modes du jour (hors clôture physique)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <p className="text-xs text-slate-500">Virement bancaire</p>
              <p className="mt-1 text-sm font-semibold">{formatSignedMoney(summary.netBankTransfer)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <p className="text-xs text-slate-500">Autre</p>
              <p className="mt-1 text-sm font-semibold">{formatSignedMoney(summary.netOther)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.otherTransactionCount} opération{summary.otherTransactionCount > 1 ? "s" : ""} — déjà
            enregistrée{summary.otherTransactionCount > 1 ? "s" : ""} dans le registre, sans comptage
            physique.
          </p>
        </section>
      ) : null}

      <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")} data-testid="cash-closing-form">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
            <Calculator className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Comptage de fin de journée</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              3 étapes : mouvements du jour → fond du matin → comptage du soir.
            </p>
          </div>
        </div>

        <div className="space-y-3" data-testid="cash-closing-theoretical-panel">
          <StepBadge step={1} label="Mouvements liquides du jour (automatique)" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className={mbokaLabelClassName}>Espèces</p>
              <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="cash-closing-theoretical-cash">
                {formatSignedMoney(summary.netCash)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className={mbokaLabelClassName}>Mobile Money</p>
              <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="cash-closing-theoretical-mobile">
                {formatSignedMoney(summary.netMobileMoney)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary.liquidTransactionCount} opération{summary.liquidTransactionCount > 1 ? "s" : ""} en
            espèces ou mobile money (revenus − dépenses).
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <MbokaPendingFieldset>
            <FieldGroup className="gap-6">
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
                  className={cn(mbokaFieldClassName, "max-w-xs")}
                />
              </Field>

              <div className="space-y-4">
                <StepBadge step={2} label="Fond de caisse ce matin" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="openingCash" className={mbokaLabelClassName}>
                      Espèces au départ
                    </FieldLabel>
                    <Input
                      id="openingCash"
                      name="openingCash"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0"
                      value={openingCashInput}
                      onChange={(event) => setOpeningCashInput(sanitizePhysicalAmount(event.target.value))}
                      className={mbokaFieldClassName}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="openingMobileMoney" className={mbokaLabelClassName}>
                      Mobile Money au départ
                    </FieldLabel>
                    <Input
                      id="openingMobileMoney"
                      name="openingMobileMoney"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0"
                      value={openingMobileMoneyInput}
                      onChange={(event) => setOpeningMobileMoneyInput(sanitizePhysicalAmount(event.target.value))}
                      className={mbokaFieldClassName}
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3" data-testid="cash-closing-expected-panel">
                <p className={mbokaLabelClassName}>Solde attendu ce soir</p>
                <div className="grid gap-3">
                  <FormulaLine
                    label="Espèces"
                    opening={Number.isFinite(openingCash) ? openingCash : 0}
                    movement={summary.netCash}
                    expected={expected.expectedCash}
                  />
                  <FormulaLine
                    label="Mobile Money"
                    opening={Number.isFinite(openingMobileMoney) ? openingMobileMoney : 0}
                    movement={summary.netMobileMoney}
                    expected={expected.expectedMobileMoney}
                  />
                </div>
                {(expected.expectedCash < 0 || expected.expectedMobileMoney < 0) && (
                  <p
                    className="text-xs text-amber-700 dark:text-amber-300"
                    data-testid="cash-closing-opening-hint"
                  >
                    Solde attendu négatif : augmentez le fond du matin (ex. s&apos;il restait 50 $ en caisse,
                    saisissez 50).
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <StepBadge step={3} label="Comptage physique ce soir" />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field className="gap-2">
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
                      placeholder="0"
                      value={realCashInput}
                      onChange={(event) => setRealCashInput(sanitizePhysicalAmount(event.target.value))}
                      className={mbokaFieldClassName}
                    />
                  </Field>
                  <Field className="gap-2">
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
                      placeholder="0"
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
                    ? " — surplus"
                    : " — manque"}
              </div>
            ) : null}

            <MbokaSubmitButton testId="cash-closing-submit" pendingLabel="Clôture...">
              Valider la clôture de caisse
            </MbokaSubmitButton>
          </MbokaPendingFieldset>
        </form>
      </section>
    </div>
  );
}
