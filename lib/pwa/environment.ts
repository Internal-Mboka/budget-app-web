export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

export function detectIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isCypressTestRun(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return "Cypress" in window;
}

/** Ne pas proposer l'installation sur login / offline / changement mot de passe. */
export function isPwaInstallContextPath(pathname: string): boolean {
  if (pathname === "/offline") {
    return false;
  }

  if (pathname.startsWith("/login")) {
    return false;
  }

  if (pathname.startsWith("/account/password")) {
    return false;
  }

  return true;
}
