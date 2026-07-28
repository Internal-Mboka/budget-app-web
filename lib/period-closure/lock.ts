import { ROLES, type RoleName } from "@/lib/permissions";
import { isDateInClosedFinancialPeriod } from "@/lib/period-closure/load-closures";

export function canBypassClosedPeriodLock(roleName: RoleName): boolean {
  return roleName === ROLES.PDG || roleName === ROLES.DIRECTEUR_TECHNIQUE;
}

export async function assertFinancialPeriodWritable(input: {
  transactionDate: Date;
  roleName: RoleName;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (canBypassClosedPeriodLock(input.roleName)) {
    return { ok: true };
  }

  const isClosed = await isDateInClosedFinancialPeriod(input.transactionDate);

  if (isClosed) {
    return {
      ok: false,
      error:
        "Ce mois est clôturé. Les ajustements rétroactifs nécessitent l'autorisation du PDG ou du DT.",
    };
  }

  return { ok: true };
}
