"use client";

import { AlertTriangle } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  cancelRevenueFormAction,
  type CancelRevenueFormState,
} from "@/lib/actions/revenue-cancellation";
import { formatMoney } from "@/lib/currency";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import {
  CANCELLATION_PENALTY_OPTIONS,
  computeCancellationAmounts,
  getCancellationPenaltyModeLabel,
  type CancellationPenaltyMode,
  type RevenueCancellationMetadata,
} from "@/lib/revenues/cancellation";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { cn } from "@/lib/utils";

type RevenueCancellationSectionProps = {
  transactionId: string;
  totalAmount: number;
  paidAmount: number;
  cancellation?: RevenueCancellationMetadata | null;
};

export function RevenueCancellationSection({
  transactionId,
  totalAmount,
  paidAmount,
  cancellation,
}: RevenueCancellationSectionProps) {
  const handledRef = useRef<CancelRevenueFormState>(null);
  const [state, formAction] = useActionState(cancelRevenueFormAction, null);
  const [penaltyMode, setPenaltyMode] = useState<CancellationPenaltyMode>(
    paidAmount > 0 ? "KEEP_DEPOSIT" : "REFUND_ALL"
  );
  const [customPenaltyInput, setCustomPenaltyInput] = useState("");
  const [reason, setReason] = useState("");

  const penaltyOptions = useMemo(
    () =>
      paidAmount > 0
        ? CANCELLATION_PENALTY_OPTIONS
        : CANCELLATION_PENALTY_OPTIONS.filter((option) => option.value === "REFUND_ALL"),
    [paidAmount]
  );

  const customPenalty = parseMoneyInput(customPenaltyInput);
  const preview = useMemo(() => {
    if (penaltyMode === "CUSTOM" && (!Number.isFinite(customPenalty) || customPenalty <= 0)) {
      return null;
    }

    return computeCancellationAmounts(
      totalAmount,
      paidAmount,
      penaltyMode,
      penaltyMode === "CUSTOM" ? customPenalty : undefined
    );
  }, [customPenalty, paidAmount, penaltyMode, totalAmount]);

  useEffect(() => {
    if (!state || state === handledRef.current || state.success) {
      return;
    }

    handledRef.current = state;
    toast.error(state.error);
  }, [state]);

  if (cancellation) {
    return (
      <section
        className={cn(
          mbokaPanelClassName,
          "space-y-4 border-rose-100 p-5 sm:p-6 dark:border-rose-950/40"
        )}
        data-testid="revenue-cancellation-info"
      >
        <div>
          <h3 className="text-base font-semibold text-rose-700 dark:text-rose-300">Annulation enregistrée</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {getCancellationPenaltyModeLabel(cancellation.penaltyMode)}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-slate-700 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-slate-200">
          <p className="font-medium text-rose-700 dark:text-rose-300">Motif</p>
          <p className="mt-1 whitespace-pre-wrap" data-testid="revenue-cancellation-reason">
            {cancellation.reason}
          </p>
        </div>

        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-300">
          <p>Pénalité conservée : {formatMoney(cancellation.penaltyKept)}</p>
          <p>Remboursé : {formatMoney(cancellation.refundedAmount)}</p>
          <p>
            Avant annulation : {formatMoney(cancellation.previousPaidAmount)} /{" "}
            {formatMoney(cancellation.previousTotalAmount)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "space-y-5 border-rose-100 p-5 sm:p-6 dark:border-rose-950/40"
      )}
      data-testid="revenue-cancellation-section"
    >
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-300">
          <AlertTriangle className="size-4" />
          Annuler la prestation
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cette action annule la réservation. Indiquez le motif et ce qu&apos;il advient de l&apos;acompte déjà
          perçu — remboursement intégral ou pénalité.
        </p>
      </div>

      <form action={formAction} className="space-y-5" data-testid="revenue-cancellation-form">
        <input type="hidden" name="transactionId" value={transactionId} />
        <input type="hidden" name="penaltyMode" value={penaltyMode} />

        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="cancellationReason" className={mbokaLabelClassName}>
                Motif d&apos;annulation *
              </FieldLabel>
              <textarea
                id="cancellationReason"
                name="reason"
                required
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex. No-show client, report météo, double réservation…"
                className={cn(mbokaFieldClassName, "min-h-24 resize-y")}
              />
            </Field>

            {paidAmount > 0 ? (
              <>
                <Field>
                  <FieldLabel htmlFor="penaltyMode" className={mbokaLabelClassName}>
                    Politique de pénalité *
                  </FieldLabel>
                  <MbokaSelect
                    id="penaltyMode"
                    name="penaltyModeDisplay"
                    value={penaltyMode}
                    onValueChange={(value) => setPenaltyMode(value as CancellationPenaltyMode)}
                    options={penaltyOptions}
                    required
                  />
                </Field>

                {penaltyMode === "CUSTOM" ? (
                  <Field>
                    <FieldLabel htmlFor="customPenaltyAmount" className={mbokaLabelClassName}>
                      Montant pénalité conservé *
                    </FieldLabel>
                    <Input
                      id="customPenaltyAmount"
                      name="customPenaltyAmount"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="0,00"
                      value={customPenaltyInput}
                      onChange={(event) => setCustomPenaltyInput(event.target.value)}
                      className={mbokaFieldClassName}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Maximum : {formatMoney(paidAmount)} (acompte perçu)
                    </p>
                  </Field>
                ) : null}
              </>
            ) : null}

            {preview ? (
              <div
                className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 dark:border-rose-950/40 dark:bg-rose-950/20"
                data-testid="revenue-cancellation-preview"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-rose-500 dark:text-rose-400">
                  Impact financier
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Pénalité {formatMoney(preview.penaltyKept)} · Remboursé {formatMoney(preview.refundedAmount)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Montants finaux : total {formatMoney(preview.totalAmount)}, encaissé{" "}
                  {formatMoney(preview.paidAmount)}, reste {formatMoney(preview.remainingAmount)}.
                </p>
              </div>
            ) : null}
          </FieldGroup>

          <MbokaSubmitButton
            testId="revenue-cancellation-submit"
            pendingLabel="Annulation..."
            className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
          >
            Confirmer l&apos;annulation
          </MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
