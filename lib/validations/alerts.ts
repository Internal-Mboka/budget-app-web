import { z } from "zod";

import { CRITICAL_ALERT_TYPES } from "@/lib/alerts/config";

const alertTypeSchema = z.enum(CRITICAL_ALERT_TYPES as [string, ...string[]]);

export const updateAlertSettingsSchema = z.object({
  alertsEnabled: z.coerce.boolean(),
  emailEnabled: z.coerce.boolean(),
  webhookEnabled: z.coerce.boolean(),
  webhookUrl: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "URL webhook invalide (http ou https requis).",
    }),
  webhookSecret: z.string().trim().optional(),
  adjustmentThresholdUsd: z.coerce
    .number()
    .positive("Le seuil doit être supérieur à 0.")
    .max(1_000_000, "Seuil trop élevé."),
  disabledAlertTypes: z.array(alertTypeSchema).default([]),
});

export type UpdateAlertSettingsInput = z.infer<typeof updateAlertSettingsSchema>;
