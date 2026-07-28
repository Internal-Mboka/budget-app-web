import { sendMbokaEmail } from "@/lib/email/send-mboka-email";
import { INVITE_TOKEN_TTL_DAYS } from "@/lib/invitations/constants";
import { formatInvitationExpiryLabel } from "@/lib/invitations/format-expiry";

type AccountProvisionedFromSeedInput = {
  email: string;
  firstName: string;
  lastName: string;
  roleLabel: string;
  loginUrl: string;
};

/** Notification après création du compte initial DT via le seeder (sans mot de passe dans l'email). */
export async function notifyAccountProvisionedFromSeed(
  input: AccountProvisionedFromSeedInput
): Promise<boolean> {
  return sendMbokaEmail(input.email, {
    subject: "Mboka Budget — Votre compte est prêt",
    previewText: `Votre compte Directeur Technique est prêt sur Mboka Budget.`,
    greeting: `Bonjour ${input.firstName},`,
    paragraphs: [
      "Bonne nouvelle : votre compte Mboka Budget est prêt.",
      `Vous avez été désigné ${input.roleLabel} sur la plateforme. Lors de votre toute première connexion, l'application vous demandera de choisir un mot de passe personnel — c'est une étape obligatoire pour sécuriser votre accès.`,
      "Le mot de passe provisoire vous a été transmis séparément, en dehors de cet email.",
    ],
    cta: {
      label: "Se connecter",
      href: input.loginUrl,
    },
    footerNote:
      "Si vous n'étiez pas au courant de cette création de compte, ignorez ce message et prévenez l'équipe Mboka.",
  });
}

type UserInvitedInput = {
  email: string;
  firstName: string;
  inviterName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresAt: Date;
};

/** Invitation admin — lien magique pour activer le compte et choisir un mot de passe. */
export async function notifyUserInvited(input: UserInvitedInput): Promise<boolean> {
  const expiryLabel = formatInvitationExpiryLabel(input.expiresAt);

  return sendMbokaEmail(input.email, {
    subject: "Mboka Budget — Activez votre compte",
    previewText: `${input.inviterName} vous invite — lien valable ${INVITE_TOKEN_TTL_DAYS} jours.`,
    greeting: `Bonjour ${input.firstName},`,
    paragraphs: [
      `${input.inviterName} vous a invité à rejoindre Mboka Budget en tant que ${input.roleLabel}.`,
      "Cliquez sur le bouton ci-dessous pour activer votre compte et choisir votre mot de passe personnel.",
      `Ce lien est valable une seule fois et expire le ${expiryLabel} (${INVITE_TOKEN_TTL_DAYS} jours).`,
    ],
    cta: {
      label: "Activer mon compte",
      href: input.inviteUrl,
    },
    footerNote:
      "Passé cette date, demandez à votre administrateur de renvoyer une invitation. Si vous n'attendiez pas ce message, ignorez-le.",
  });
}
