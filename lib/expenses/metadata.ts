import { z } from "zod";

const expenseMetadataSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis."),
  notes: z.string().trim().max(2000).optional(),
});

export type ExpenseMetadata = z.infer<typeof expenseMetadataSchema>;

export function parseExpenseMetadata(raw: unknown): ExpenseMetadata {
  return expenseMetadataSchema.parse(raw);
}

export function buildExpenseMetadataFromFormData(formData: FormData): ExpenseMetadata {
  return parseExpenseMetadata({
    label: String(formData.get("label") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
}

export function getExpenseMetadataSummary(metadata: ExpenseMetadata | null | undefined): string {
  if (!metadata?.label) {
    return "Libellé non renseigné";
  }

  return metadata.label;
}
