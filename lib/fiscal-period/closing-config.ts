/** US-78 : si true, le PDG/DT peut valider seul sans visa comptable préalable. */
export function isPdgSoloFiscalClosingEnabled(): boolean {
  const raw = process.env.FISCAL_PERIOD_PDG_SOLO_CLOSING?.trim().toLowerCase();

  if (!raw) {
    return false;
  }

  return raw === "true" || raw === "1" || raw === "yes";
}
