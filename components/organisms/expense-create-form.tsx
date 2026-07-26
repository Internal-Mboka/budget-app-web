"use client";

import type { ExpenseCategory } from "@prisma/client";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createExpenseFormAction, type CreateExpenseFormState } from "@/lib/actions/expenses";
import { ExpenseStaffFields } from "@/components/organisms/expense-staff-fields";
import {
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/expenses/categories";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

const categoryOptions = EXPENSE_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "CDF", label: "CDF (FC)" },
];

type ExpenseCreateFormProps = {
  defaultCategory?: ExpenseCategory;
};

export function ExpenseCreateForm({ defaultCategory }: ExpenseCreateFormProps = {}) {
  const handledStateRef = useRef<CreateExpenseFormState>(null);
  const [state, formAction] = useActionState(createExpenseFormAction, null);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(
    defaultCategory ?? "MATERIEL_EQUIPEMENT"
  );
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [staffPaymentType, setStaffPaymentType] = useState("CACHET");
  const isStaffExpense = expenseCategory === "PAIES_CACHETS_STAFF";

  useEffect(() => {
    if (!state || state === handledStateRef.current || state.success) {
      return;
    }

    handledStateRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-6 p-5 sm:p-6")}>
      <form action={formAction} className="space-y-6" data-testid="expense-create-form">
        <MbokaPendingFieldset>
          <FieldGroup className="gap-5">
            <input type="hidden" name="expenseCategory" value={expenseCategory} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="paymentMethod" value={paymentMethod} />

            <Field>
              <FieldLabel htmlFor="expenseCategory" className={mbokaLabelClassName}>
                Catégorie de dépense *
              </FieldLabel>
              <MbokaSelect
                id="expenseCategory"
                name="expenseCategoryDisplay"
                value={expenseCategory}
                onValueChange={(value) => setExpenseCategory(value as ExpenseCategory)}
                options={categoryOptions}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="label" className={mbokaLabelClassName}>
                Libellé {isStaffExpense ? "" : "*"}
              </FieldLabel>
              <Input
                id="label"
                name="label"
                required={!isStaffExpense}
                placeholder={
                  isStaffExpense
                    ? "Optionnel — généré automatiquement si vide"
                    : "Ex. Achat micro Shure, Loyer mensuel…"
                }
                className={mbokaFieldClassName}
              />
            </Field>

            {isStaffExpense ? (
              <ExpenseStaffFields
                paymentType={staffPaymentType}
                onPaymentTypeChange={setStaffPaymentType}
              />
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="totalAmount" className={mbokaLabelClassName}>
                  Montant *
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
                  Mode de paiement *
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

          <MbokaSubmitButton testId="expense-create-submit">Enregistrer la dépense</MbokaSubmitButton>
        </MbokaPendingFieldset>
      </form>
    </section>
  );
}
