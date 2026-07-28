import { MBOKA } from "@/lib/design-tokens";

/** Tokens email alignés sur le design system Mboka (globals.css + design-tokens.ts). */
export const MBOKA_EMAIL = {
  brand: MBOKA.brand,
  brandHover: MBOKA.brandHover,
  secondary: "#eff8ff",
  border: "#e0f2fe",
  muted: "#64748b",
  text: "#10579f",
  accent: "#38bdf8",
  cardBackground: "#ffffff",
  pageBackground: "#f8fbff",
} as const;

export type MbokaEmailCta = {
  label: string;
  href: string;
};

export type MbokaEmailRenderInput = {
  /** Texte court affiché dans l'aperçu boîte mail. */
  previewText: string;
  greeting: string;
  paragraphs: string[];
  cta?: MbokaEmailCta;
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

/** Rendu HTML + texte brut à partir du contenu métier uniquement. */
export function renderMbokaEmail(input: MbokaEmailRenderInput): { html: string; text: string } {
  const logoUrl = getMbokaEmailLogoUrl();
  const greeting = escapeHtml(input.greeting);
  const previewText = escapeHtml(input.previewText);

  const paragraphHtml = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${MBOKA_EMAIL.text};">${escapeHtml(paragraph)}</p>`
    )
    .join("");

  const ctaHtml = input.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
        <tr>
          <td align="center" style="border-radius:16px;background:${MBOKA_EMAIL.brand};">
            <a href="${escapeHtml(input.cta.href)}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;">
              ${escapeHtml(input.cta.label)}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${MBOKA_EMAIL.muted};word-break:break-all;">
        ${escapeHtml(input.cta.href)}
      </p>`
    : "";

  const footerNoteHtml = input.footerNote
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${MBOKA_EMAIL.border};font-size:13px;line-height:1.6;color:${MBOKA_EMAIL.muted};">${escapeHtml(input.footerNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Mboka Budget</title>
</head>
<body style="margin:0;padding:0;background:${MBOKA_EMAIL.pageBackground};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:linear-gradient(180deg, ${MBOKA_EMAIL.secondary} 0%, ${MBOKA_EMAIL.pageBackground} 48%, #ffffff 100%);padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${MBOKA_EMAIL.cardBackground};border:1px solid ${MBOKA_EMAIL.border};border-radius:24px;box-shadow:0 20px 60px rgba(16, 87, 159, 0.10);overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 20px;text-align:center;background:${MBOKA_EMAIL.secondary};border-bottom:1px solid ${MBOKA_EMAIL.border};">
              <img src="${escapeHtml(logoUrl)}" alt="Mboka Budget" width="120" height="120" style="display:block;margin:0 auto 12px;max-width:120px;height:auto;" />
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${MBOKA_EMAIL.accent};">Mboka Budget</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:${MBOKA_EMAIL.text};">${greeting}</p>
              ${paragraphHtml}
              ${ctaHtml}
              ${footerNoteHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:${MBOKA_EMAIL.pageBackground};border-top:1px solid ${MBOKA_EMAIL.border};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${MBOKA_EMAIL.muted};text-align:center;">
                Mboka Studio · Plateforme de gestion financière et opérationnelle
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParagraphs = input.paragraphs.join("\n\n");
  const textCta = input.cta ? `\n\n${input.cta.label} :\n${input.cta.href}\n` : "";
  const textFooter = input.footerNote ? `\n\n${input.footerNote}` : "";

  const text = `${input.greeting}

${textParagraphs}${textCta}${textFooter}

— L'équipe Mboka Budget
Mboka Studio · Plateforme de gestion financière et opérationnelle`;

  return { html, text };
}
