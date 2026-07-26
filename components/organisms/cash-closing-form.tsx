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

export function CashClosingForm({ theoretical, defaultClosingDate }: CashClosingFormProps) {
  const handledStateRef = useRef<CashClosingFormState>(null);
  const [state, formAction] = useActionState(createCashClosingFormAction, null);
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
    const realCash = parseMoneyInput(realCashInput);
    const realMobileMoney = parseMoneyInput(realMobileMoneyInput);

    if (!Number.isFinite(realCash) || !Number.isFinite(realMobileMoney)) {
      return null;
    }

    return computeCashClosingGap({
      theoreticalCash: theoretical.theoreticalCash,
      theoreticalMobileMoney: theoretical.theoreticalMobileMoney,
      realCash,
      realMobileMoney,
    });
  }, [realCashInput, realMobileMoneyInput, theoretical.theoreticalCash, theoretical.theoreticalMobileMoney]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")} data-testid="cash-closing-form">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
          <Calculator className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Comptage de fin de journée</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Montants théoriques calculés sur {theoretical.transactionCount} transaction
            {theoretical.transactionCount > 1 ? "s" : ""} validée
            {theoretical.transactionCount > 1 ? "s" : ""} (espèces et mobile money).
          </p>
        </div>
      </div>

      <div
        className="grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:grid-cols-2 dark:border-sky-900 dark:bg-sky-950/20"
        data-testid="cash-closing-theoretical-panel"
      >
        <div>
          <p className={mbokaLabelClassName}>Espèces théoriques</p>
          <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="cash-closing-theoretical-cash">
            {formatMoney(theoretical.theoreticalCash)}
          </p>
        </div>
        <div>
          <p className={mbokaLabelClassName}>Mobile Money théorique</p>
          <p
            className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50"
            data-testid="cash-closing-theoretical-mobile"
          >
            {formatMoney(theoretical.theoreticalMobileMoney)}
          </p>
        </div>
      </div>

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
                  onChange={(event) => setRealCashInput(event.target.value)}
                  className={mbokaFieldClassName}
                />
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
                  onChange={(event) => setRealMobileMoneyInput(event.target.value)}
                  className={mbokaFieldClassName}
                />
              </Field>
            </div>
          </FieldGroup>

          {preview ? (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                preview.hasDiscrepancy
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
              )}
              data-testid="cash-closing-gap-preview"
            >
              Écart calculé :{" "}
              <span className="font-semibold" data-testid="cash-closing-gap-amount">
                {formatMoney(preview.gapAmount)}
              </span>
              {preview.hasDiscrepancy ? " — écart détecté" : " — caisse conforme"}
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
