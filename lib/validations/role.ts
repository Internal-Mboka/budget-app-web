import { z } from "zod";

export const toggleRolePermissionSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionSlug: z.string().min(1),
  enabled: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value) => value === true || value === "true"),
});
