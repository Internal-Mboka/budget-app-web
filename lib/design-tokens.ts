/** Tokens visuels Mboka — alignés sur la branche main. */
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

export const authFieldClassName =
  "w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#10579F] focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-sky-900 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:bg-slate-900 dark:focus:ring-sky-900";

export const authLabelClassName =
  "mb-2 block text-sm font-medium text-[#10579F] dark:text-sky-100";

export const authButtonClassName =
  "w-full rounded-2xl bg-[#10579F] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-[#0d4a87] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-sky-950/40";
