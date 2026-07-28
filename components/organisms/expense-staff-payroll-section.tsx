"use client";

import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import {
  getStaffPaymentTypeLabel,
  type StaffPayrollMetadata,
} from "@/lib/expenses/staff-payroll";
import { cn } from "@/lib/utils";

type ExpenseStaffPayrollSectionProps = {
  staffPayroll: StaffPayrollMetadata;
};

export function ExpenseStaffPayrollSection({ staffPayroll }: ExpenseStaffPayrollSectionProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="expense-staff-payroll-section"
    >
      <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Rémunération staff</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={mbokaLabelClassName}>Intervenant</p>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100" data-testid="expense-staff-recipient">
            {staffPayroll.recipientName}
          </p>
        </div>

        <div>
          <p className={mbokaLabelClassName}>Type</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200" data-testid="expense-staff-payment-type">
            {getStaffPaymentTypeLabel(staffPayroll.paymentType)}
          </p>
        </div>

        {staffPayroll.role ? (
          <div>
            <p className={mbokaLabelClassName}>Fonction</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{staffPayroll.role}</p>
          </div>
        ) : null}

        {staffPayroll.periodLabel ? (
          <div>
            <p className={mbokaLabelClassName}>Période</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{staffPayroll.periodLabel}</p>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <p className={mbokaLabelClassName}>Prestation</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200" data-testid="expense-staff-service-details">
            {staffPayroll.serviceDetails}
          </p>
        </div>
      </div>
    </section>
  );
}
