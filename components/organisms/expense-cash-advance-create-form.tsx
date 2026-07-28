"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createCashAdvanceRequestFormAction,
  type CashAdvanceFormState,
} from "@/lib/actions/cash-advance";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "CDF", label: "CDF (FC)" },
];

export function ExpenseCashAdvanceCreateForm() {
  const handledStateRef = useRef<CashAdvanceFormState>(null);
  const [state, formAction] = useActionState(createCashAdvanceRequestFormAction, null);
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    if (!state || state === handledStateRef.current || state.success) {
      return;
    }

    handledStateRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
      <form action={formAction} className="space-y-6" data-testid="expense-cash-advance-create-form">
        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />

            <Field>
              <FieldLabel htmlFor="purpose" className={mbokaLabelClassName}>
                Motif de l&apos;avance *
              </FieldLabel>
              <Input
                id="purpose"
                name="purpose"
                required
                placeholder="Ex. achat urgent de câbles et adaptateurs pour le studio"
                className={mbokaFieldClassName}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="totalAmount" className={mbokaLabelClassName}>
                  Montant estimé *
                </FieldLabel>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="150"
                  className={mbokaFieldClassName}
                />
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
                  testId="currency"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="paymentMethod" className={mbokaLabelClassName}>
                Mode de décaissement prévu *
              </FieldLabel>
              <MbokaSelect
                id="paymentMethod"
                name="paymentMethodDisplay"
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                testId="paymentMethod"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes" className={mbokaLabelClassName}>
                Notes internes
              </FieldLabel>
              <Input
                id="notes"
                name="notes"
                placeholder="Contexte ou urgence (optionnel)"
                className={mbokaFieldClassName}
              />
            </Field>
          </FieldGroup>

          <MbokaSubmitButton testId="expense-cash-advance-create-submit" pendingLabel="Envoi...">
            Soumettre la demande
          </MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
