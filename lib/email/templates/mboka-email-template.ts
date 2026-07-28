import { MBOKA } from "@/lib/design-tokens";

/** Tokens email alignés sur le design system Mboka (globals.css + design-tokens.ts). */
export const MBOKA_EMAIL = {
  brand: MBOKA.brand,
  brandHover: MBOKA.brandHover,
  secondary: "#eff8ff",
  border: "#e0f2fe",
  muted: "#64748b",
  text: "#0f172a",
  textBrand: "#10579f",
  accent: "#38bdf8",
  cardBackground: "#ffffff",
  pageBackground: "#f8fbff",
  cardShadow: MBOKA.cardShadow,
} as const;

export type MbokaEmailCta = {
  label: string;
  href: string;
};

export type MbokaEmailCallout = {
  title: string;
  lines: string[];
};

export type MbokaEmailRenderInput = {
  /** Texte court affiché dans l'aperçu boîte mail. */
  previewText: string;
  /** Titre principal sous l'en-tête (ex. « Activez votre compte »). */
  headline?: string;
  greeting: string;
  paragraphs: string[];
  /** Encadré d'information (rôle, expiration, montant…). */
  callout?: MbokaEmailCallout;
  cta?: MbokaEmailCta;
  /** Lien brut sous le bouton si le CTA ne s'affiche pas (défaut : true). */
  showCtaFallbackLink?: boolean;
  footerNote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getMbokaEmailLogoUrl(): string {
  const base =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";

  return `${base.replace(/\/$/, "")}/photos/mboka.png`;
}

/** Logo distant uniquement en prod — évite l'icône cassée en dev local. */
function shouldIncludeLogoImage(): boolean {
  const base =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";

  return Boolean(base && !/localhost|127\.0\.0\.1/i.test(base));
}

function renderBrandHeader(): string {
  const logoBlock = shouldIncludeLogoImage()
    ? `<img src="${escapeHtml(getMbokaEmailLogoUrl())}" alt="" width="72" height="72" style="display:block;margin:0 auto 14px;max-width:72px;height:auto;" />`
    : "";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:36px 32px 28px;background:linear-gradient(180deg, ${MBOKA_EMAIL.secondary} 0%, ${MBOKA_EMAIL.pageBackground} 100%);border-bottom:1px solid ${MBOKA_EMAIL.border};">
        ${logoBlock}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 14px;">
          <tr>
            <td align="center" width="56" height="56" style="width:56px;height:56px;border-radius:18px;background:${MBOKA_EMAIL.brand};box-shadow:0 8px 24px rgba(16, 87, 159, 0.25);">
              <span style="display:block;font-size:24px;font-weight:700;color:#ffffff;line-height:56px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">M</span>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${MBOKA_EMAIL.accent};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Mboka Budget</p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:${MBOKA_EMAIL.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Gestion financière &amp; opérationnelle</p>
      </td>
    </tr>
  </table>`;
}

function renderCallout(callout: MbokaEmailCallout): string {
  const linesHtml = callout.lines
    .map(
      (line) =>
        `<p style="margin:0 0 6px;font-size:14px;line-height:1.55;color:${MBOKA_EMAIL.textBrand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(line)}</p>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px;">
    <tr>
      <td style="padding:16px 18px;background:${MBOKA_EMAIL.secondary};border:1px solid ${MBOKA_EMAIL.border};border-left:4px solid ${MBOKA_EMAIL.brand};border-radius:0 16px 16px 0;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${MBOKA_EMAIL.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(callout.title)}</p>
        ${linesHtml}
      </td>
    </tr>
  </table>`;
}

function renderCta(cta: MbokaEmailCta, showFallback: boolean): string {
  const buttonHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
    <tr>
      <td align="center" style="border-radius:16px;background:${MBOKA_EMAIL.brand};box-shadow:0 10px 30px rgba(16, 87, 159, 0.22);">
        <a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener noreferrer"
           style="display:block;padding:15px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          ${escapeHtml(cta.label)}
        </a>
      </td>
    </tr>
  </table>`;

  const fallbackHtml = showFallback
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:${MBOKA_EMAIL.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        Le bouton ne fonctionne pas&nbsp;? Copiez ce lien dans votre navigateur&nbsp;:<br />
        <a href="${escapeHtml(cta.href)}" style="color:${MBOKA_EMAIL.textBrand};word-break:break-all;">${escapeHtml(cta.href)}</a>
      </p>`
    : "";

  return buttonHtml + fallbackHtml;
}

/** Rendu HTML + texte brut à partir du contenu métier uniquement. */
export function renderMbokaEmail(input: MbokaEmailRenderInput): { html: string; text: string } {
  const previewText = escapeHtml(input.previewText);
  const greeting = escapeHtml(input.greeting);
  const headline = input.headline ? escapeHtml(input.headline) : "";

  const headlineHtml = headline
    ? `<h1 style="margin:0 0 16px;font-size:22px;font-weight:600;line-height:1.3;letter-spacing:-0.02em;color:${MBOKA_EMAIL.textBrand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${headline}</h1>`
    : "";

  const paragraphHtml = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${MBOKA_EMAIL.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(paragraph)}</p>`
    )
    .join("");

  const calloutHtml = input.callout ? renderCallout(input.callout) : "";

  const showFallback = input.showCtaFallbackLink ?? Boolean(input.cta);
  const ctaHtml = input.cta ? renderCta(input.cta, showFallback) : "";

  const footerNoteHtml = input.footerNote
    ? `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${MBOKA_EMAIL.border};font-size:13px;line-height:1.65;color:${MBOKA_EMAIL.muted};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(input.footerNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Mboka Budget</title>
</head>
<body style="margin:0;padding:0;background:${MBOKA_EMAIL.pageBackground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg, ${MBOKA_EMAIL.secondary} 0%, ${MBOKA_EMAIL.pageBackground} 48%, #ffffff 100%);padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${MBOKA_EMAIL.cardBackground};border:1px solid ${MBOKA_EMAIL.border};border-radius:24px;box-shadow:${MBOKA_EMAIL.cardShadow};overflow:hidden;">
          <tr>
            <td style="padding:0;">
              ${renderBrandHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;">
              ${headlineHtml}
              <p style="margin:0 0 18px;font-size:15px;font-weight:600;line-height:1.5;color:${MBOKA_EMAIL.textBrand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${greeting}</p>
              ${paragraphHtml}
              ${calloutHtml}
              ${ctaHtml}
              ${footerNoteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:${MBOKA_EMAIL.pageBackground};border-top:1px solid ${MBOKA_EMAIL.border};">
              <p style="margin:0 0 8px;font-size:11px;line-height:1.5;color:${MBOKA_EMAIL.muted};text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Cet email a été envoyé automatiquement — merci de ne pas y répondre.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${MBOKA_EMAIL.muted};text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <strong style="color:${MBOKA_EMAIL.textBrand};font-weight:600;">Mboka Studio</strong> · Plateforme de gestion financière et opérationnelle
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textHeadline = input.headline ? `${input.headline}\n\n` : "";
  const textParagraphs = input.paragraphs.join("\n\n");
  const textCallout = input.callout
    ? `\n\n${input.callout.title}\n${input.callout.lines.join("\n")}`
    : "";
  const textCta = input.cta ? `\n\n${input.cta.label} :\n${input.cta.href}\n` : "";
  const textFooter = input.footerNote ? `\n\n${input.footerNote}` : "";

  const text = `${textHeadline}${input.greeting}

${textParagraphs}${textCallout}${textCta}${textFooter}

— L'équipe Mboka Budget
Mboka Studio · Plateforme de gestion financière et opérationnelle`;

  return { html, text };
}
