import { ROLES, type RoleName } from "@/lib/permissions";

const TWO_FACTOR_ROLES: RoleName[] = [ROLES.PDG, ROLES.COMPTABLE];

export function canEnableTwoFactor(roleName: string): boolean {
  return TWO_FACTOR_ROLES.includes(roleName as RoleName);
}

type TwoFactorUser = {
  roleName: string;
  twoFactorEnabled: boolean;
};

export function requiresTwoFactorAtLogin(user: TwoFactorUser): boolean {
  return user.twoFactorEnabled && canEnableTwoFactor(user.roleName);
}
