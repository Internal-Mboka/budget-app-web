import { z } from "zod";

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const revokeDeviceSchema = z.object({
  fingerprint: z.string().min(1),
});
