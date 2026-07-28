const LEGACY_DISMISS_KEY = "mboka-pwa-install-dismissed";
const DISMISS_AT_KEY = "mboka-pwa-install-dismissed-at";
const SESSION_COUNT_KEY = "mboka-pwa-install-session-count";
const SESSION_LAST_SHOWN_KEY = "mboka-pwa-install-session-last-at";

/** Relance le prompt après 14 jours si l'utilisateur l'a fermé. */
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Max 3 affichages par session navigateur, espacés d'au moins 15 minutes. */
export const PWA_PROMPT_MAX_DISPLAYS_PER_SESSION = 3;
export const PWA_PROMPT_DISPLAY_INTERVAL_MS = 15 * 60 * 1000;

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

export function canShowPwaInstallPromptThisSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const count = Number(window.sessionStorage.getItem(SESSION_COUNT_KEY) ?? "0");

  if (!Number.isFinite(count) || count >= PWA_PROMPT_MAX_DISPLAYS_PER_SESSION) {
    return false;
  }

  if (count === 0) {
    return true;
  }

  const lastShownAt = Number(window.sessionStorage.getItem(SESSION_LAST_SHOWN_KEY) ?? "0");

  if (!Number.isFinite(lastShownAt) || lastShownAt <= 0) {
    return true;
  }

  return Date.now() - lastShownAt >= PWA_PROMPT_DISPLAY_INTERVAL_MS;
}

export function markPwaInstallPromptShownThisSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  const count = Number(window.sessionStorage.getItem(SESSION_COUNT_KEY) ?? "0");
  const nextCount = Number.isFinite(count) ? count + 1 : 1;

  window.sessionStorage.setItem(SESSION_COUNT_KEY, String(nextCount));
  window.sessionStorage.setItem(SESSION_LAST_SHOWN_KEY, String(Date.now()));
}

export function clearPwaInstallPromptSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SESSION_COUNT_KEY);
  window.sessionStorage.removeItem(SESSION_LAST_SHOWN_KEY);
}
