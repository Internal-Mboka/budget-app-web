"use client";

import type { RevenueCategory } from "@prisma/client";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { ClientPickerField } from "@/components/organisms/client-picker-field";
import { RevenueMetadataFields } from "@/components/organisms/revenue-metadata-fields";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createRevenueFormAction, type CreateRevenueFormState } from "@/lib/actions/revenues";
import type { ClientSearchResult } from "@/lib/clients/search";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { REVENUE_CATEGORY_OPTIONS, MIX_SERVICE_TYPE_OPTIONS, STUDIO_ROOM_OPTIONS } from "@/lib/revenues/categories";
import {
  getPaymentStatusPreviewHint,
  getPaymentStatusPreviewLabel,
} from "@/lib/revenues/status";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/transactions/payment-methods";
import { parseMoneyInput } from "@/lib/transactions/decimal";
import { cn } from "@/lib/utils";

const categoryOptions = REVENUE_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "CDF", label: "CDF (FC)" },
];

export function RevenueCreateForm() {
  const handledStateRef = useRef<CreateRevenueFormState>(null);
  const [state, formAction] = useActionState(createRevenueFormAction, null);
  const [revenueCategory, setRevenueCategory] = useState<RevenueCategory>("STUDIO_SESSION");
  const [client, setClient] = useState<ClientSearchResult | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [studioRoom, setStudioRoom] = useState(STUDIO_ROOM_OPTIONS[0]?.value ?? "A");
  const [serviceType, setServiceType] = useState(MIX_SERVICE_TYPE_OPTIONS[0]?.value ?? "MIX");
  const [totalAmountInput, setTotalAmountInput] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState("0");

  const totalAmount = parseMoneyInput(totalAmountInput);
  const paidAmount = parseMoneyInput(paidAmountInput);
  const statusPreview =
    Number.isFinite(totalAmount) && Number.isFinite(paidAmount)
      ? getPaymentStatusPreviewLabel(totalAmount, paidAmount)
      : "—";
  const statusHint =
    Number.isFinite(totalAmount) && Number.isFinite(paidAmount)
      ? getPaymentStatusPreviewHint(totalAmount, paidAmount)
      : "Saisissez les montants pour prévisualiser le statut.";

  useEffect(() => {
    if (!state || state === handledStateRef.current || state.success) {
      return;
    }

    handledStateRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
      <form
        action={formAction}
        className="space-y-6"
        data-testid="revenue-create-form"
        onSubmit={(event) => {
          if (!client) {
            event.preventDefault();
            toast.error("Veuillez sélectionner un client.");
          }
        }}
      >
        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <input type="hidden" name="revenueCategory" value={revenueCategory} />
            <input type="hidden" name="clientId" value={client?.id ?? ""} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />

            <Field>
              <FieldLabel htmlFor="revenueCategory" className={mbokaLabelClassName}>
                Catégorie de revenu *
              </FieldLabel>
              <MbokaSelect
                id="revenueCategory"
                name="revenueCategoryDisplay"
                value={revenueCategory}
                onValueChange={(value) => setRevenueCategory(value as RevenueCategory)}
                options={categoryOptions}
                required
              />
            </Field>

            <ClientPickerField
              value={client}
              onChange={setClient}
              label="Client *"
              placeholder="Rechercher un client…"
            />

            <RevenueMetadataFields
              category={revenueCategory}
              serviceType={serviceType}
              onServiceTypeChange={setServiceType}
              studioRoom={studioRoom}
              onStudioRoomChange={setStudioRoom}
            />

            <input type="hidden" name="metadataStudioRoom" value={studioRoom} />
            <input type="hidden" name="metadataServiceType" value={serviceType} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="totalAmount" className={mbokaLabelClassName}>
                  Montant total *
                </FieldLabel>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                  value={totalAmountInput}
                  onChange={(event) => setTotalAmountInput(event.target.value)}
                  className={mbokaFieldClassName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="paidAmount" className={mbokaLabelClassName}>
                  Acompte perçu
                </FieldLabel>
                <Input
                  id="paidAmount"
                  name="paidAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={paidAmountInput}
                  onChange={(event) => setPaidAmountInput(event.target.value)}
                  className={mbokaFieldClassName}
                />
              </Field>

              <Field className="sm:col-span-2">
                <div
                  className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 dark:border-sky-900 dark:bg-slate-800/60"
                  data-testid="revenue-status-preview"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-500 dark:text-sky-400">
                    Statut calculé automatiquement
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">{statusPreview}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{statusHint}</p>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="currency" className={mbokaLabelClassName}>
                  Devise *
                </FieldLabel>
                <MbokaSelect
                  id="currency"
                  name="currencyDisplay"
                  value={currency}
                  onValueChange={setCurrency}
                  options={currencyOptions}
                  required
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

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="notes" className={mbokaLabelClassName}>
                  Notes internes
                </FieldLabel>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Informations complémentaires…"
                  className={mbokaFieldClassName}
                />
              </Field>
            </div>
          </FieldGroup>

          <MbokaSubmitButton testId="revenue-create-submit">Enregistrer le revenu</MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
