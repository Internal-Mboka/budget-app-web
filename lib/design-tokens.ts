/**
 * Pattern UI Mboka — référence : page /login
 * À utiliser sur toutes les pages de l'application.
 */
export const MBOKA = {
  brand: "#10579F",
  brandHover: "#0d4a87",
  gradientLight:
    "linear-gradient(180deg, #eff8ff 0%, #f8fbff 48%, #ffffff 100%)",
  gradientDark:
    "linear-gradient(180deg, #0a1628 0%, #0f1d32 48%, #0a1628 100%)",
  cardShadow: "0 20px 60px rgba(16, 87, 159, 0.10)",
  logoFilter:
    "brightness(0) saturate(100%) invert(25%) sepia(94%) saturate(1320%) hue-rotate(179deg) brightness(92%) contrast(92%)",
} as const;

export const mbokaPageClassName =
  "min-h-full bg-[image:var(--mboka-gradient)] text-[#10579F] dark:text-sky-100";

export const mbokaPanelClassName =
  "rounded-4xl border border-sky-100 bg-white/90 shadow-[var(--mboka-card-shadow)] backdrop-blur dark:border-sky-900 dark:bg-slate-900/90";

export const mbokaEyebrowClassName =
  "text-sm font-medium uppercase tracking-[0.28em] text-sky-400";

export const mbokaTitleClassName =
  "text-3xl font-semibold tracking-tight text-[#10579F] dark:text-sky-50";

export const mbokaSubtitleClassName =
  "text-sm leading-6 text-slate-500 dark:text-slate-400";

export const mbokaFieldClassName =
  "h-auto min-h-[48px] w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-slate-900 dark:focus:ring-sky-900";

export const mbokaLabelClassName =
  "mb-2 block text-sm font-medium text-[#10579F] dark:text-sky-100";

/** Bouton pleine largeur — identique à la branche main (login). */
export const mbokaSubmitButtonClassName =
  "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10579F] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0d4a87] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-sky-950/40";

export const mbokaButtonPrimaryClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10579F] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0d4a87] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-sky-950/40";

export const mbokaButtonOutlineClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-[#10579F] transition hover:bg-sky-50 dark:border-sky-900 dark:bg-slate-900 dark:text-sky-100 dark:hover:bg-slate-800";

/** @deprecated Utiliser mbokaFieldClassName */
export const authFieldClassName = mbokaFieldClassName;
/** @deprecated Utiliser mbokaLabelClassName */
export const authLabelClassName = mbokaLabelClassName;
/** @deprecated Utiliser mbokaButtonPrimaryClassName */
export const authButtonClassName = mbokaButtonPrimaryClassName;

export const ROLE_LABELS: Record<string, string> = {
  PDG: "PDG",
  DIRECTEUR_TECHNIQUE: "Directeur Technique",
  COMPTABLE: "Comptable",
  SECRETAIRE: "Secrétaire",
  OBSERVATEUR: "Observateur",
};
