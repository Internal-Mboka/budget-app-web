import { z } from "zod";

import { MAX_CLIENT_TAGS, normalizeClientTag } from "@/lib/clients/tags";

export const clientTagSchema = z
  .string()
  .trim()
  .min(2, "Le tag doit contenir au moins 2 caractères.")
  .max(32, "Le tag ne peut pas dépasser 32 caractères.")
  .transform(normalizeClientTag);

export const clientTagMutationSchema = z.object({
  clientId: z.string().trim().min(1, "Client invalide."),
  tag: clientTagSchema,
});

export const clientTagRemovalSchema = z.object({
  clientId: z.string().trim().min(1, "Client invalide."),
  tag: z.string().trim().min(1, "Tag invalide."),
});

export { MAX_CLIENT_TAGS };
