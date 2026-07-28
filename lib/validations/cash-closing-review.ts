import { z } from "zod";

const instructionSchema = z
  .string()
  .trim()
  .min(5, "L'instruction doit contenir au moins 5 caractères.")
  .max(2000, "L'instruction ne peut pas dépasser 2000 caractères.");

export const resolveCashClosingReviewSchema = z.object({
  closingId: z.string().min(1, "Clôture introuvable."),
  reviewerInstruction: instructionSchema,
});

export const approveCashClosingReviewSchema = z.object({
  closingId: z.string().min(1, "Clôture introuvable."),
  reviewerInstruction: z
    .string()
    .trim()
    .max(2000, "L'instruction ne peut pas dépasser 2000 caractères.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});
