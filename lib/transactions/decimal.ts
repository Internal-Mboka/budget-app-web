export function decimalToNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value.toString());
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Accepte "34.99", "34,99" et valeurs numériques des champs HTML. */
export function parseMoneyInput(value: unknown): number {
  if (value == null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}
