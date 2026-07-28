import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** Libellé naturel pour l'expiration d'une invitation (emails, UI). */
export function formatInvitationExpiryLabel(expiresAt: Date): string {
  return format(expiresAt, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
}
