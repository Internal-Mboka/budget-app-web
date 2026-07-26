import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom est requis"),
  lastName: z.string().trim().min(2, "Le nom est requis"),
  email: z.string().trim().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre"),
  roleId: z.coerce.number().int().positive("Rôle invalide"),
});

export const updateUserSchema = z.object({
  userId: z.string().trim().min(1),
  firstName: z.string().trim().min(2, "Le prénom est requis"),
  lastName: z.string().trim().min(2, "Le nom est requis"),
  email: z.string().trim().email("Adresse email invalide"),
  roleId: z.coerce.number().int().positive("Rôle invalide"),
});

export const toggleUserActiveSchema = z.object({
  userId: z.string().trim().min(1),
  isActive: z.coerce.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
