type TwoFactorUser = {
  twoFactorEnabled: boolean;
};

export function canEnableTwoFactor(_roleName?: string): boolean {
  return true;
}

export function requiresTwoFactorAtLogin(user: TwoFactorUser): boolean {
  return user.twoFactorEnabled;
}
