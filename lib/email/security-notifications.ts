import { sendTransactionalEmail } from "@/lib/email/send-transactional";

type PasswordChangedNotificationInput = {
  email: string;
  firstName: string;
  context: "self_change" | "admin_reset" | "forgot_reset" | "first_login";
};

export async function notifyPasswordChanged(input: PasswordChangedNotificationInput) {
  const subject = "Mboka Budget — Votre mot de passe a été modifié";
  const body = `Bonjour ${input.firstName},

Votre mot de passe Mboka Budget vient d'être modifié (${input.context}).

Si vous n'êtes pas à l'origine de cette action, contactez immédiatement un administrateur.

— Mboka Budget`;

  await sendTransactionalEmail({ to: input.email, subject, text: body });
}

export async function notifyPasswordResetRequested(email: string, resetUrl: string) {
  const subject = "Mboka Budget — Réinitialisation de mot de passe";
  const body = `Une demande de réinitialisation a été enregistrée.

Lien (valide 1 h) : ${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

— Mboka Budget`;

  await sendTransactionalEmail({ to: email, subject, text: body });
}
