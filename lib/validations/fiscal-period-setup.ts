import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const fiscalPeriodSetupSchema = z
  .object({
    startDate: z.string().regex(DATE_PATTERN, "Indiquez une date de début valide."),
    skipOpeningBalance: z.coerce.boolean(),
    openingBalanceCash: z.coerce.number().min(0, "Montant espèces invalide.").optional(),
    openingBalanceMobile: z.coerce.number().min(0, "Montant mobile money invalide.").optional(),
    openingBalanceBank: z.coerce.number().min(0, "Montant banque invalide.").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.skipOpeningBalance) {
      return;
    }

    const hasAnyBalance =
      data.openingBalanceCash !== undefined ||
      data.openingBalanceMobile !== undefined ||
      data.openingBalanceBank !== undefined;

    if (!hasAnyBalance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez au moins un solde d'ouverture ou cochez « Nouveau départ ».",
        path: ["openingBalanceCash"],
      });
    }
  });

export type FiscalPeriodSetupInput = z.infer<typeof fiscalPeriodSetupSchema>;

export function parseFiscalPeriodSetupFormData(formData: FormData): FiscalPeriodSetupInput {
  const skipOpeningBalance = formData.get("skipOpeningBalance") === "on";

  const parseOptionalAmount = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
    if (!raw) {
      return undefined;
    }

    return Number(raw);
  };

  return fiscalPeriodSetupSchema.parse({
    startDate: String(formData.get("startDate") ?? "").trim(),
    skipOpeningBalance,
    openingBalanceCash: skipOpeningBalance ? undefined : parseOptionalAmount("openingBalanceCash"),
    openingBalanceMobile: skipOpeningBalance ? undefined : parseOptionalAmount("openingBalanceMobile"),
    openingBalanceBank: skipOpeningBalance ? undefined : parseOptionalAmount("openingBalanceBank"),
  });
}
