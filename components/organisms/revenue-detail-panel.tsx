"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Receipt } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { RevenueStatusBadges } from "@/components/molecules/revenue-status-badges";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  markRevenueRealizedFormAction,
  recordRevenuePaymentFormAction,
  type MarkRevenueRealizedFormState,
  type RecordRevenuePaymentFormState,
} from "@/lib/actions/revenue-payments";
import { RevenueCancellationSection } from "@/components/organisms/revenue-cancellation-section";
import { formatMoney } from "@/lib/currency";
import {
  mbokaButtonOutlineClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import type { RevenueFulfillmentMetadata } from "@/lib/revenues/fulfillment";
import type { RevenueCancellationMetadata } from "@/lib/revenues/cancellation";
import { getRevenueMetadataSummary, type RevenueMetadata } from "@/lib/revenues/metadata";
import {
  canCancelRevenue,
  canMarkRevenueRealized,
  canRecordRevenuePayment,
  getPaymentStatusPreviewHint,
} from "@/lib/revenues/status";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";
import type { PaymentStatus, RevenueCategory } from "@prisma/client";

export type RevenueDetailData = {
  id: string;
  code: string;
  revenueCategory: RevenueCategory;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  metadata: RevenueMetadata | null;
  fulfillment: RevenueFulfillmentMetadata;
  cancellation?: RevenueCancellationMetadata | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  } | null;
  canCancel?: boolean;
};

type RevenueDetailPanelProps = {
  revenue: RevenueDetailData;
  flash?: {
    created?: boolean;
    paid?: "partial" | "solde";
    realized?: boolean;
    cancelled?: boolean;
  };
};

function DetailDate({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMMM yyyy 'à' HH:mm", { locale: fr }));
  }, [isoDate]);

  return (
    <span suppressHydrationWarning>{label || "—"}</span>
  );
}

export function RevenueDetailPanel({ revenue, flash }: RevenueDetailPanelProps) {
  const handledPaymentRef = useRef<RecordRevenuePaymentFormState>(null);
  const handledRealizedRef = useRef<MarkRevenueRealizedFormState>(null);
  const [paymentState, paymentAction] = useActionState(recordRevenuePaymentFormAction, null);
  const [realizedState, realizedAction] = useActionState(markRevenueRealizedFormAction, null);
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(revenue.paymentMethod ?? "");

  const paymentPreviewAmount = parseMoneyInput(paymentAmountInput);
  const projectedPaid =
    Number.isFinite(paymentPreviewAmount) && paymentPreviewAmount > 0
      ? revenue.paidAmount + paymentPreviewAmount
      : revenue.paidAmount;
  const projectedRemaining = Math.max(revenue.totalAmount - projectedPaid, 0);
  const paymentHint =
    Number.isFinite(paymentPreviewAmount) && paymentPreviewAmount > 0
      ? getPaymentStatusPreviewHint(revenue.totalAmount, projectedPaid)
      : "Saisissez le montant encaissé pour prévisualiser le nouveau statut financier.";

  const showPaymentForm = canRecordRevenuePayment(revenue.status, revenue.remainingAmount);
  const showRealizedAction = canMarkRevenueRealized(revenue.status, revenue.fulfillment);
  const showCancelAction = Boolean(revenue.canCancel) && canCancelRevenue(revenue.status);

  useEffect(() => {
    if (flash?.created) {
      toast.success(`Revenu ${revenue.code} enregistré.`);
    } else if (flash?.paid === "solde") {
      toast.success("Solde encaissé — revenu soldé.");
    } else if (flash?.paid === "partial") {
      toast.success("Paiement enregistré.");
    } else if (flash?.realized) {
      toast.success("Prestation marquée comme réalisée.");
    } else if (flash?.cancelled) {
      toast.success("Revenu annulé.");
    }
  }, [flash?.created, flash?.paid, flash?.realized, flash?.cancelled, revenue.code]);

  useEffect(() => {
    if (!paymentState || paymentState === handledPaymentRef.current || paymentState.success) {
      return;
    }

    handledPaymentRef.current = paymentState;
    toast.error(paymentState.error);
  }, [paymentState]);

  useEffect(() => {
    if (!realizedState || realizedState === handledRealizedRef.current || realizedState.success) {
      return;
    }

    handledRealizedRef.current = realizedState;
    toast.error(realizedState.error);
  }, [realizedState]);

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="revenue-detail-panel">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
            <Receipt className="size-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#10579F] dark:text-sky-50">{revenue.code}</h2>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-[#10579F] dark:bg-sky-950/40 dark:text-sky-300">
                {getRevenueCategoryLabel(revenue.revenueCategory)}
              </span>
            </div>

            <RevenueStatusBadges
              financialStatus={revenue.status}
              fulfillment={revenue.fulfillment}
            />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {revenue.client ? (
                <Link
                  href={`/clients/${revenue.client.id}`}
                  className="font-medium text-[#10579F] hover:underline dark:text-sky-300"
                >
                  {revenue.client.name}
                </Link>
              ) : (
                "Client non renseigné"
              )}
              {" · "}
              {getRevenueMetadataSummary(revenue.revenueCategory, revenue.metadata)}
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Créé le <DetailDate isoDate={revenue.createdAt} />
              {revenue.fulfillment.realizedAt ? (
                <>
                  {" · "}
                  Réalisé le{" "}
                  <DetailDate isoDate={revenue.fulfillment.realizedAt} />
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-500">Total</p>
            <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="revenue-detail-total">
              {formatMoney(revenue.totalAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-500">Encaissé</p>
            <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="revenue-detail-paid">
              {formatMoney(revenue.paidAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-500">Reste à payer</p>
            <p className="mt-1 text-lg font-semibold text-[#10579F] dark:text-sky-50" data-testid="revenue-detail-remaining">
              {formatMoney(revenue.remainingAmount)}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mode de paiement : {getPaymentMethodLabel(revenue.paymentMethod)}
        </p>
      </section>

      {showPaymentForm ? (
        <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="revenue-payment-form-section">
          <div>
            <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Enregistrer un paiement</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ajoutez un encaissement (acompte complémentaire ou solde). Le reste à payer et le statut financier
              seront recalculés automatiquement.
            </p>
          </div>

          <form action={paymentAction} className="space-y-5" data-testid="revenue-payment-form">
            <input type="hidden" name="transactionId" value={revenue.id} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />

            <MbokaPendingFieldset>
              <FieldGroup className="gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="paymentAmount" className={mbokaLabelClassName}>
                      Montant encaissé *
                    </FieldLabel>
                    <Input
                      id="paymentAmount"
                      name="paymentAmount"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="0,00"
                      value={paymentAmountInput}
                      onChange={(event) => setPaymentAmountInput(event.target.value)}
                      className={mbokaFieldClassName}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="paymentMethod" className={mbokaLabelClassName}>
                      Mode de paiement
                    </FieldLabel>
                    <MbokaSelect
                      id="paymentMethod"
                      name="paymentMethodDisplay"
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      options={[{ value: "", label: "Non renseigné" }, ...PAYMENT_METHOD_OPTIONS]}
                    />
                  </Field>
                </div>

                <div
                  className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60"
                  data-testid="revenue-payment-preview"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-500 dark:text-sky-400">
                    Après encaissement
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">
                    Reste {formatMoney(projectedRemaining)} · Encaissé {formatMoney(projectedPaid)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{paymentHint}</p>
                </div>
              </FieldGroup>

              <MbokaSubmitButton testId="revenue-payment-submit" pendingLabel="Enregistrement...">
                Enregistrer le paiement
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>
        </section>
      ) : null}

      {showRealizedAction ? (
        <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")} data-testid="revenue-realized-section">
          <div>
            <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Statut opérationnel</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Marquez la prestation comme réalisée une fois le service effectué. Ce statut est indépendant du
              règlement financier.
            </p>
          </div>

          <form action={realizedAction} data-testid="revenue-realized-form">
            <input type="hidden" name="transactionId" value={revenue.id} />
            <MbokaPendingFieldset>
              <MbokaSubmitButton
                testId="revenue-realized-submit"
                pendingLabel="Mise à jour..."
                className={cn(mbokaButtonOutlineClassName, "border-[#10579F] text-[#10579F] dark:border-sky-400 dark:text-sky-50")}
              >
                <CheckCircle2 className="size-4" />
                Marquer session réalisée
              </MbokaSubmitButton>
            </MbokaPendingFieldset>
          </form>
        </section>
      ) : null}

      {showCancelAction || revenue.cancellation ? (
        <RevenueCancellationSection
          transactionId={revenue.id}
          totalAmount={revenue.totalAmount}
          paidAmount={revenue.paidAmount}
          cancellation={revenue.cancellation}
        />
      ) : null}
    </div>
  );
}
