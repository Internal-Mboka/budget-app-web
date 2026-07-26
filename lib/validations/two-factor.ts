import { z } from "zod";

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Le code doit contenir 6 chiffres.");

export const confirmTwoFactorSchema = z.object({
  code: totpCodeSchema,
});

export const disableTwoFactorSchema = z.object({
  code: totpCodeSchema,
});

export const completeTwoFactorLoginSchema = z.object({
  code: totpCodeSchema,
});
