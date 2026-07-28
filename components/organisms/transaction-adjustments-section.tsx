"use client";

import { Scale } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createTransactionAdjustmentFormAction,
  type CreateTransactionAdjustmentFormState,
} from "@/lib/actions/transaction-adjustments";
import { formatMoney } from "@/lib/currency";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import {
  getAdjustmentKindLabel,
  getNetTransactionAmount,
  getRemainingAdjustableAmount,
  type TransactionAdjustmentRecord,
} from "@/lib/transactions/adjustments";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { cn } from "@/lib/utils";

const adjustmentModeOptions = [
  { value: "PARTIAL", label: "Régularisation partielle" },
  { value: "FULL", label: "Régularisation totale (avoir complet)" },
];

type TransactionAdjustmentsSectionProps = {
  transactionId: string;
  parentCode: string;
  parentTotalAmount: number;
  detailBasePath: "/revenues" | "/expenses";
  adjustments: TransactionAdjustmentRecord[];
  canCreate: boolean;
};

export function TransactionAdjustmentsSection({
  transactionId,
  parentCode,
  parentTotalAmount,
  detailBasePath,
  adjustments,
  canCreate,
}: TransactionAdjustmentsSectionProps) {
  const handledRef = useRef<CreateTransactionAdjustmentFormState>(null);
  const [state, formAction] = useActionState(createTransactionAdjustmentFormAction, null);
  const [mode, setMode] = useState<"PARTIAL" | "FULL">("PARTIAL");
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");

  const remainingAdjustable = getRemainingAdjustableAmount(parentTotalAmount, adjustments);
  const netAmount = getNetTransactionAmount(parentTotalAmount, adjustments);
  const partialAmount = parseMoneyInput(amountInput);
  const previewAmount =
    mode === "FULL"
      ? remainingAdjustable
      : Number.isFinite(partialAmount) && partialAmount > 0
        ? Math.min(partialAmount, remainingAdjustable)
        : 0;

  const showForm = canCreate && remainingAdjustable > 0;

  useEffect(() => {
    if (!state || state === handledRef.current || state.success) {
      return;
    }

    handledRef.current = state;
    toast.error(state.error);
  }, [state]);

  const previewNet = useMemo(
    () => getNetTransactionAmount(parentTotalAmount, [
      ...adjustments,
      ...(previewAmount > 0 ? [{ totalAmount: previewAmount }] : []),
    ]),
    [adjustments, parentTotalAmount, previewAmount]
  );

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")}
      data-testid="transaction-adjustments-section"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <Scale className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            Avoirs & régularisations
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Corrigez une erreur financière sans supprimer l&apos;enregistrement d&apos;origine ({parentCode}).
            Chaque avoir crée une écriture liée immuable.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-500">Montant initial</p>
          <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">
            {formatMoney(parentTotalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Régularisations</p>
          <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-200" data-testid="transaction-adjustments-total">
            -{formatMoney(parentTotalAmount - netAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Montant net</p>
          <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200" data-testid="transaction-net-amount">
            {formatMoney(netAmount)}
          </p>
        </div>
      </div>

      {adjustments.length > 0 ? (
        <div className="space-y-3" data-testid="transaction-adjustments-list">
          {adjustments.map((adjustment, index) => (
            <article
              key={adjustment.id}
              data-testid={`transaction-adjustment-${index}`}
              className="rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 dark:border-amber-900/40 dark:bg-slate-900/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${detailBasePath}/${adjustment.id}`}
                      className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                    >
                      {adjustment.code}
                    </Link>
                    {adjustment.metadata ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {getAdjustmentKindLabel(adjustment.metadata.kind)}
                      </span>
                    ) : null}
                  </div>
                  {adjustment.metadata?.reason ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{adjustment.metadata.reason}</p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  -{formatMoney(adjustment.totalAmount)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Aucune régularisation enregistrée.</p>
      )}

      {showForm ? (
        <form action={formAction} className="space-y-5" data-testid="transaction-adjustment-form">
          <input type="hidden" name="transactionId" value={transactionId} />
          <input type="hidden" name="mode" value={mode} />

          <MbokaPendingFieldset>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="adjustmentMode" className={mbokaLabelClassName}>
                  Type de régularisation
                </FieldLabel>
                <MbokaSelect
                  id="adjustmentMode"
                  name="adjustmentModeDisplay"
                  value={mode}
                  onValueChange={(value) => setMode(value as "PARTIAL" | "FULL")}
                  options={adjustmentModeOptions}
                />
              </Field>

              {mode === "PARTIAL" ? (
                <Field>
                  <FieldLabel htmlFor="adjustmentAmount" className={mbokaLabelClassName}>
                    Montant à régulariser *
                  </FieldLabel>
                  <Input
                    id="adjustmentAmount"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0,00"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    className={mbokaFieldClassName}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Maximum régularisable : {formatMoney(remainingAdjustable)}
                  </p>
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="adjustmentReason" className={mbokaLabelClassName}>
                  Motif *
                </FieldLabel>
                <Input
                  id="adjustmentReason"
                  name="reason"
                  required
                  placeholder="Ex. Erreur de saisie, remboursement client…"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className={mbokaFieldClassName}
                />
              </Field>

              <div
                className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20"
                data-testid="transaction-adjustment-preview"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Après régularisation</p>
                <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  Avoir {formatMoney(previewAmount)} · Net {formatMoney(previewNet)}
                </p>
              </div>
            </FieldGroup>

            <MbokaSubmitButton testId="transaction-adjustment-submit" pendingLabel="Émission...">
              Émettre l&apos;avoir / régularisation
            </MbokaSubmitButton>
          </MbokaPendingFieldset>
        </form>
      ) : null}
    </section>
  );
}
