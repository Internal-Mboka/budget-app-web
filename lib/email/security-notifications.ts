import { sendMbokaEmail } from "@/lib/email/send-mboka-email";

type PasswordChangedNotificationInput = {
  email: string;
  firstName: string;
  context: "self_change" | "admin_reset" | "forgot_reset" | "first_login";
};

const PASSWORD_CHANGED_CONTEXT_LABELS: Record<PasswordChangedNotificationInput["context"], string> =
  {
    self_change: "depuis votre espace compte",
    admin_reset: "par un administrateur",
    forgot_reset: "via la réinitialisation par email",
    first_login: "lors de votre première connexion",
  };

export async function notifyPasswordChanged(input: PasswordChangedNotificationInput) {
  const contextLabel = PASSWORD_CHANGED_CONTEXT_LABELS[input.context];

  await sendMbokaEmail(input.email, {
    subject: "Mboka Budget — Votre mot de passe a été modifié",
    previewText: "Votre mot de passe Mboka Budget vient d'être modifié.",
    greeting: `Bonjour ${input.firstName},`,
    paragraphs: [
      `Votre mot de passe Mboka Budget vient d'être modifié ${contextLabel}.`,
      "Si vous n'êtes pas à l'origine de cette action, contactez immédiatement un administrateur.",
    ],
  });
}

export async function notifyPasswordResetRequested(email: string, resetUrl: string) {
  await sendMbokaEmail(email, {
    subject: "Mboka Budget — Réinitialisation de mot de passe",
    previewText: "Demande de réinitialisation de votre mot de passe Mboka Budget.",
    greeting: "Bonjour,",
    paragraphs: [
      "Une demande de réinitialisation de mot de passe a été enregistrée pour votre compte Mboka Budget.",
      "Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois.",
    ],
    cta: {
      label: "Réinitialiser mon mot de passe",
      href: resetUrl,
    },
    footerNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  });
}
