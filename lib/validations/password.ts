import { z } from "zod";

export const passwordComplexitySchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordComplexitySchema,
    confirmPassword: z.string().min(1, "Confirmation requise"),
    requireCurrentPassword: z.coerce.boolean().default(true),
    revokeOtherDevices: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      });
    }

    if (data.requireCurrentPassword && !data.currentPassword?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Mot de passe actuel requis",
        path: ["currentPassword"],
      });
    }
  });

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Adresse email invalide"),
});

export const resetPasswordWithTokenSchema = z
  .object({
    token: z.string().trim().min(1, "Lien invalide"),
    newPassword: passwordComplexitySchema,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      });
    }
  });

export const adminResetPasswordSchema = z.object({
  userId: z.string().trim().min(1),
  newPassword: passwordComplexitySchema,
});
