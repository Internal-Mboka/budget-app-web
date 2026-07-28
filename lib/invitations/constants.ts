/** Standard B2B SaaS pour les invitations par email (WorkOS, Bento) : 7 jours. */
export const INVITE_TOKEN_TTL_DAYS = 7;

export const INVITE_TOKEN_TTL_MS = INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export const INVITE_TOKEN_TTL_HOURS = INVITE_TOKEN_TTL_MS / (60 * 60 * 1000);
