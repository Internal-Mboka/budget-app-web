import { z } from "zod";

export const STAFF_PAYMENT_TYPE_OPTIONS = [
  { value: "SALARY", label: "Salaire" },
  { value: "CACHET", label: "Cachet / prestation" },
] as const;

export const STAFF_PAYMENT_TYPE_LABELS = {
  SALARY: "Salaire",
  CACHET: "Cachet",
} as const;

export type StaffPaymentType = keyof typeof STAFF_PAYMENT_TYPE_LABELS;

const staffPayrollSchema = z.object({
  recipientName: z.string().trim().min(1, "Intervenant requis."),
  paymentType: z.enum(["SALARY", "CACHET"]),
  role: z.string().trim().optional(),
  serviceDetails: z.string().trim().min(1, "Détails de la prestation requis."),
  periodLabel: z.string().trim().optional(),
});

export type StaffPayrollMetadata = z.infer<typeof staffPayrollSchema>;

export function parseStaffPayrollMetadata(raw: unknown): StaffPayrollMetadata | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const staffPayroll = record.staffPayroll;

  if (!staffPayroll || typeof staffPayroll !== "object") {
    return null;
  }

  const parsed = staffPayrollSchema.safeParse(staffPayroll);
  return parsed.success ? parsed.data : null;
}

export function buildStaffPayrollFromFormData(formData: FormData): StaffPayrollMetadata {
  return staffPayrollSchema.parse({
    recipientName: String(formData.get("staffRecipientName") ?? ""),
    paymentType: String(formData.get("staffPaymentType") ?? "CACHET"),
    role: String(formData.get("staffRole") ?? "") || undefined,
    serviceDetails: String(formData.get("staffServiceDetails") ?? ""),
    periodLabel: String(formData.get("staffPeriodLabel") ?? "") || undefined,
  });
}

export function getStaffPaymentTypeLabel(paymentType: StaffPaymentType | string): string {
  return STAFF_PAYMENT_TYPE_LABELS[paymentType as StaffPaymentType] ?? paymentType;
}

export function buildStaffPayrollLabel(staffPayroll: StaffPayrollMetadata): string {
  const typeLabel = getStaffPaymentTypeLabel(staffPayroll.paymentType);
  const period = staffPayroll.periodLabel ? ` · ${staffPayroll.periodLabel}` : "";
  return `${typeLabel} — ${staffPayroll.recipientName} (${staffPayroll.serviceDetails})${period}`;
}

export function getStaffPayrollSummary(staffPayroll: StaffPayrollMetadata | null | undefined): string {
  if (!staffPayroll) {
    return "Paie / cachet staff";
  }

  return buildStaffPayrollLabel(staffPayroll);
}
