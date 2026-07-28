import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import {
  findAuthenticatedUserById,
  toAuthUser,
  validateUserCredentials,
} from "@/lib/auth/credentials";
import { recordFailedLoginAttempt } from "@/lib/audit/failed-login";
import { verifyTwoFactorChallenge } from "@/lib/two-factor/challenge";

const credentialsSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(1).optional(),
  twoFactorChallenge: z.string().min(1).optional(),
});

export const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Mot de passe", type: "password" },
    twoFactorChallenge: { label: "Challenge 2FA", type: "text" },
  },
  async authorize(credentials) {
    try {
      const parsed = credentialsSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const { email, password, twoFactorChallenge } = parsed.data;

      if (twoFactorChallenge) {
        const userId = await verifyTwoFactorChallenge(twoFactorChallenge);

        if (!userId) {
          return null;
        }

        const user = await findAuthenticatedUserById(userId);

        if (!user) {
          return null;
        }

        return toAuthUser(user);
      }

      if (!email || !password) {
        return null;
      }

      const user = await validateUserCredentials(email, password);

      if (!user) {
        await recordFailedLoginAttempt(email);
        return null;
      }

      return toAuthUser(user);
    } catch (error) {
      console.error("Credentials authorize failed", error);
      return null;
    }
  },
});
