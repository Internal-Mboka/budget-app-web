import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { PermissionSlug, RoleName } from "@/lib/permissions";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Mot de passe", type: "password" },
  },
  async authorize(credentials) {
    try {
      const parsed = loginSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const { email, password } = parsed.data;

      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return null;
      }

      const permissions = user.role.permissions.map(
        (permission) => permission.slug as PermissionSlug
      );

      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roleId: user.roleId,
        roleName: user.role.name as RoleName,
        permissions,
      };
    } catch (error) {
      console.error("Credentials authorize failed", error);
      return null;
    }
  },
});
