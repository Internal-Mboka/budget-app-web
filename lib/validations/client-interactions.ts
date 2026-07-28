import { z } from "zod";

export const MAX_CLIENT_NOTE_LENGTH = 2000;

export const clientNoteSchema = z.object({
  clientId: z.string().trim().min(1, "Client invalide."),
  content: z
    .string()
    .trim()
    .min(2, "La note doit contenir au moins 2 caractères.")
    .max(MAX_CLIENT_NOTE_LENGTH, `La note ne peut pas dépasser ${MAX_CLIENT_NOTE_LENGTH} caractères.`),
});
