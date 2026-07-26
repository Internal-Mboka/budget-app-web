"use client";

import type { RevenueCategory } from "@prisma/client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
import type { DiscountType } from "@/lib/revenues/pricing";
import { previewDiscountedTotal } from "@/lib/validations/revenue";
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

const discountTypeOptions = [
  { value: "NONE", label: "Aucune remise" },
  { value: "PERCENT", label: "Pourcentage (%)" },
  { value: "FIXED", label: "Montant fixe" },
];

type RevenueCreateFormProps = {
  canApplyDiscount?: boolean;
  defaultSessionDate: string;
};

export function RevenueCreateForm({
  canApplyDiscount = false,
  defaultSessionDate,
}: RevenueCreateFormProps) {
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
  const [baseAmountInput, setBaseAmountInput] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValueInput, setDiscountValueInput] = useState("");

  const baseAmount = parseMoneyInput(baseAmountInput || totalAmountInput);
  const discountValue = parseMoneyInput(discountValueInput);
  const computedTotal = useMemo(() => {
    if (!canApplyDiscount || discountType === "NONE" || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      return baseAmount;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return baseAmount;
    }

    return previewDiscountedTotal(baseAmount, discountType, discountValue);
  }, [baseAmount, canApplyDiscount, discountType, discountValue]);

  useEffect(() => {
    if (!canApplyDiscount || discountType === "NONE") {
      return;
    }

    if (Number.isFinite(computedTotal) && computedTotal >= 0) {
      setTotalAmountInput(String(computedTotal));
    }
  }, [canApplyDiscount, computedTotal, discountType]);

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
              defaultSessionDate={defaultSessionDate}
            />

            <input type="hidden" name="metadataStudioRoom" value={studioRoom} />
            <input type="hidden" name="metadataServiceType" value={serviceType} />
            {canApplyDiscount ? (
              <>
                <input type="hidden" name="discountType" value={discountType} />
                <input type="hidden" name="baseAmount" value={baseAmountInput || totalAmountInput} />
                <input type="hidden" name="discountValue" value={discountValueInput} />
              </>
            ) : null}

            {canApplyDiscount ? (
              <div
                className="grid gap-5 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:grid-cols-3 dark:border-sky-900 dark:bg-slate-800/40"
                data-testid="revenue-discount-section"
              >
                <Field className="sm:col-span-3">
                  <FieldLabel className={mbokaLabelClassName}>Remise commerciale</FieldLabel>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prix d&apos;origine, remise accordée et total final seront conservés dans les métadonnées et le PDF.
                  </p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="baseAmount" className={mbokaLabelClassName}>
                    Prix d&apos;origine
                  </FieldLabel>
                  <Input
                    id="baseAmount"
                    name="baseAmountDisplay"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={baseAmountInput}
                    onChange={(event) => setBaseAmountInput(event.target.value)}
                    className={mbokaFieldClassName}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="discountType" className={mbokaLabelClassName}>
                    Type de remise
                  </FieldLabel>
                  <MbokaSelect
                    id="discountType"
                    name="discountTypeDisplay"
                    value={discountType}
                    onValueChange={(value) => setDiscountType(value as DiscountType)}
                    options={discountTypeOptions}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="discountValue" className={mbokaLabelClassName}>
                    Valeur remise
                  </FieldLabel>
                  <Input
                    id="discountValue"
                    name="discountValueDisplay"
                    type="text"
                    inputMode="decimal"
                    placeholder={discountType === "PERCENT" ? "10" : "0,00"}
                    value={discountValueInput}
                    onChange={(event) => setDiscountValueInput(event.target.value)}
                    className={mbokaFieldClassName}
                    disabled={discountType === "NONE"}
                  />
                </Field>
              </div>
            ) : null}

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
