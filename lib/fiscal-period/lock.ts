import { loadOpenFiscalPeriod } from "@/lib/fiscal-period/load-fiscal-periods";

/** US-75 : saisies financières bloquées tant qu'aucun trimestre OPEN n'existe. US-76 étendra les verrous CLOSING/CLOSED. */
export async function assertOpenFiscalPeriodForFinancialWrite(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const openPeriod = await loadOpenFiscalPeriod();

  if (!openPeriod) {
    return {
      ok: false,
      error:
        "Aucun trimestre comptable ouvert. Le PDG doit initialiser le 1er trimestre depuis le tableau de bord.",
    };
  }

  return { ok: true };
}
