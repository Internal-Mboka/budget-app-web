import type { DefaultSession } from "next-auth";

import type { PermissionSlug, RoleName } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleId: number;
      roleName: RoleName;
      permissions: PermissionSlug[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roleId: number;
    roleName: RoleName;
    permissions: PermissionSlug[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleId?: number;
    roleName?: RoleName;
    permissions?: PermissionSlug[];
  }
}
