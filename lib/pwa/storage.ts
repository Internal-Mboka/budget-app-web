const LEGACY_DISMISS_KEY = "mboka-pwa-install-dismissed";
const DISMISS_AT_KEY = "mboka-pwa-install-dismissed-at";

/** Relance le prompt après 14 jours si l'utilisateur l'a fermé. */
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function isPwaInstallPromptDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.localStorage.getItem(LEGACY_DISMISS_KEY) === "true") {
    markPwaInstallPromptDismissed();
    window.localStorage.removeItem(LEGACY_DISMISS_KEY);
    return true;
  }

  const raw = window.localStorage.getItem(DISMISS_AT_KEY);

  if (!raw) {
    return false;
  }

  const dismissedAt = Number(raw);

  if (!Number.isFinite(dismissedAt)) {
    return true;
  }

  return Date.now() - dismissedAt < DISMISS_TTL_MS;
}

export function markPwaInstallPromptDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISMISS_AT_KEY, String(Date.now()));
}

export function clearPwaInstallPromptDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DISMISS_AT_KEY);
  window.localStorage.removeItem(LEGACY_DISMISS_KEY);
}
