import type { ExpenseCategory } from "@prisma/client";
import { z } from "zod";

import {
  buildStaffPayrollFromFormData,
  buildStaffPayrollLabel,
  parseStaffPayrollMetadata,
  type StaffPayrollMetadata,
} from "@/lib/expenses/staff-payroll";

const baseExpenseMetadataSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis."),
  notes: z.string().trim().max(2000).optional(),
});

export type ExpenseMetadata = z.infer<typeof baseExpenseMetadataSchema> & {
  staffPayroll?: StaffPayrollMetadata;
};

export function parseExpenseMetadata(raw: unknown): ExpenseMetadata {
  const base = baseExpenseMetadataSchema.parse(raw);
  const staffPayroll = parseStaffPayrollMetadata(raw);

  return staffPayroll ? { ...base, staffPayroll } : base;
}

export function buildExpenseMetadataFromFormData(
  formData: FormData,
  category: ExpenseCategory
): ExpenseMetadata {
  if (category === "PAIES_CACHETS_STAFF") {
    const staffPayroll = buildStaffPayrollFromFormData(formData);
    const rawLabel = String(formData.get("label") ?? "").trim();

    return {
      label: rawLabel || buildStaffPayrollLabel(staffPayroll),
      notes: String(formData.get("notes") ?? "") || undefined,
      staffPayroll,
    };
  }

  return parseExpenseMetadata({
    label: String(formData.get("label") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
}

export function getExpenseMetadataSummary(metadata: ExpenseMetadata | null | undefined): string {
  if (!metadata) {
    return "Libellé non renseigné";
  }

  if (metadata.staffPayroll) {
    return buildStaffPayrollLabel(metadata.staffPayroll);
  }

  return metadata.label || "Libellé non renseigné";
}
