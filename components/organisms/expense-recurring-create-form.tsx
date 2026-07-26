"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createRecurringExpenseTemplateFormAction,
  type RecurringExpenseFormState,
} from "@/lib/actions/recurring-expenses";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/expenses/categories";
import { RECURRING_PERIOD_OPTIONS } from "@/lib/expenses/recurring";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

const categoryOptions = EXPENSE_CATEGORY_OPTIONS.filter(
  (option) => option.value !== "PAIES_CACHETS_STAFF"
).map((option) => ({
  value: option.value,
  label: option.label,
}));

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "CDF", label: "CDF (FC)" },
];

const dueDayOptions = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1;

  return { value: String(day), label: `Le ${day} de chaque période` };
});

export function ExpenseRecurringCreateForm() {
  const handledStateRef = useRef<RecurringExpenseFormState>(null);
  const [state, formAction] = useActionState(createRecurringExpenseTemplateFormAction, null);
  const [expenseCategory, setExpenseCategory] = useState("LOYER_CHARGES_FIXES");
  const [recurringPeriod, setRecurringPeriod] = useState("MONTHLY");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("1");

  useEffect(() => {
    if (!state || state === handledStateRef.current || state.success) {
      return;
    }

    handledStateRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
      <form action={formAction} className="space-y-6" data-testid="expense-recurring-create-form">
        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <input type="hidden" name="expenseCategory" value={expenseCategory} />
            <input type="hidden" name="recurringPeriod" value={recurringPeriod} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
            <input type="hidden" name="dueDayOfMonth" value={dueDayOfMonth} />

            <Field>
              <FieldLabel htmlFor="expenseCategory" className={mbokaLabelClassName}>
                Catégorie *
              </FieldLabel>
              <MbokaSelect
                id="expenseCategory"
                name="expenseCategoryDisplay"
                value={expenseCategory}
                onValueChange={setExpenseCategory}
                options={categoryOptions}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="label" className={mbokaLabelClassName}>
                Libellé *
              </FieldLabel>
              <Input
                id="label"
                name="label"
                required
                placeholder="Ex. Loyer studio, Abonnement Internet…"
                className={mbokaFieldClassName}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="recurringPeriod" className={mbokaLabelClassName}>
                  Fréquence *
                </FieldLabel>
                <MbokaSelect
                  id="recurringPeriod"
                  name="recurringPeriodDisplay"
                  value={recurringPeriod}
                  onValueChange={setRecurringPeriod}
                  options={[...RECURRING_PERIOD_OPTIONS]}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dueDayOfMonth" className={mbokaLabelClassName}>
                  Jour d'échéance *
                </FieldLabel>
                <MbokaSelect
                  id="dueDayOfMonth"
                  name="dueDayOfMonthDisplay"
                  value={dueDayOfMonth}
                  onValueChange={setDueDayOfMonth}
                  options={dueDayOptions}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="totalAmount" className={mbokaLabelClassName}>
                  Montant estimé *
                </FieldLabel>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
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
                  required
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="paymentMethod" className={mbokaLabelClassName}>
                  Mode de paiement prévu *
                </FieldLabel>
                <MbokaSelect
                  id="paymentMethod"
                  name="paymentMethodDisplay"
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  options={PAYMENT_METHOD_OPTIONS}
                  required
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

          <MbokaSubmitButton testId="expense-recurring-create-submit">
            Enregistrer la dépense récurrente
          </MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
