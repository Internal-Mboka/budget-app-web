import { PERMISSIONS, type PermissionSlug } from "@/lib/permissions";
import { isDateInClosedFinancialPeriod } from "@/lib/period-closure/load-closures";

export async function assertFinancialPeriodWritable(input: {
  transactionDate: Date;
  permissions: PermissionSlug[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const isPdg = input.permissions.includes(PERMISSIONS.DASHBOARD_FULL);

  if (isPdg) {
    return { ok: true };
  }

  const isClosed = await isDateInClosedFinancialPeriod(input.transactionDate);

  if (isClosed) {
    return {
      ok: false,
      error:
        "Ce mois est clôturé. Les ajustements rétroactifs nécessitent l'autorisation du PDG.",
    };
  }

  return { ok: true };
}
