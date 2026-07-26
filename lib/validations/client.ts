import { z } from "zod";

const clientCategorySchema = z.enum([
  "ARTISTE_INDEPENDANT",
  "LABEL_MAISON_DE_DISQUE",
  "ENTREPRISE_MARQUE",
  "PARTICULIER_OCCASIONNEL",
]);

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: clientCategorySchema,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Adresse email invalide.",
    })
    .transform((value) => (value ? value.toLowerCase() : undefined)),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.extend({
  id: z.string().trim().min(1, "Client invalide."),
  address: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ""),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ""),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
