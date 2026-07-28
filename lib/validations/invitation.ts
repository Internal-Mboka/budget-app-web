import { z } from "zod";

import { passwordComplexitySchema } from "@/lib/validations/password";

export const acceptInvitationSchema = z
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

export const resendInvitationSchema = z.object({
  userId: z.string().trim().min(1),
});
