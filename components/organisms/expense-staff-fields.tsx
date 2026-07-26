"use client";

import type { ExpenseCategory } from "@prisma/client";
import { useState } from "react";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { STAFF_PAYMENT_TYPE_OPTIONS } from "@/lib/expenses/staff-payroll";
import { mbokaFieldClassName, mbokaLabelClassName } from "@/lib/design-tokens";

type ExpenseStaffFieldsProps = {
  paymentType: string;
  onPaymentTypeChange: (value: string) => void;
};

export function ExpenseStaffFields({ paymentType, onPaymentTypeChange }: ExpenseStaffFieldsProps) {
  const [periodLabel] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  });

  return (
    <div
      className="grid gap-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:grid-cols-2 dark:border-violet-900 dark:bg-slate-800/40"
      data-testid="expense-staff-fields"
    >
      <Field className="sm:col-span-2">
        <FieldLabel className={mbokaLabelClassName}>Rémunération staff</FieldLabel>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Intervenant, type de paiement et prestation associée — ventilés dans les charges de personnel.
        </p>
      </Field>

      <Field>
        <FieldLabel htmlFor="staffRecipientName" className={mbokaLabelClassName}>
          Intervenant *
        </FieldLabel>
        <Input
          id="staffRecipientName"
          name="staffRecipientName"
          required
          placeholder="Ex. Marc, Jean-Paul…"
          className={mbokaFieldClassName}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="staffPaymentType" className={mbokaLabelClassName}>
          Type de paiement *
        </FieldLabel>
        <MbokaSelect
          id="staffPaymentType"
          name="staffPaymentType"
          value={paymentType}
          onValueChange={onPaymentTypeChange}
          options={[...STAFF_PAYMENT_TYPE_OPTIONS]}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="staffRole" className={mbokaLabelClassName}>
          Fonction
        </FieldLabel>
        <Input
          id="staffRole"
          name="staffRole"
          placeholder="Ex. Ingénieur du son"
          className={mbokaFieldClassName}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="staffPeriodLabel" className={mbokaLabelClassName}>
          Période
        </FieldLabel>
        <Input
          id="staffPeriodLabel"
          name="staffPeriodLabel"
          defaultValue={periodLabel}
          placeholder="Ex. Juillet 2026"
          className={mbokaFieldClassName}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="staffServiceDetails" className={mbokaLabelClassName}>
          Détails de la prestation *
        </FieldLabel>
        <Input
          id="staffServiceDetails"
          name="staffServiceDetails"
          required
          placeholder="Ex. Session mix album XYZ, cachet régie du 12/07…"
          className={mbokaFieldClassName}
        />
      </Field>
    </div>
  );
}
