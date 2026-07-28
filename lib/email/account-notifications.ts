import { sendTransactionalEmail } from "@/lib/email/send-transactional";

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
  const subject = "Mboka Budget — Votre compte est prêt";
  const body = `Bonjour ${input.firstName},

Bonne nouvelle : votre compte Mboka Budget est prêt.

Vous avez été désigné ${input.roleLabel} sur la plateforme. Dès que vous le souhaitez, connectez-vous ici :
${input.loginUrl}

Lors de votre toute première connexion, l'application vous demandera de choisir un mot de passe personnel — c'est une étape obligatoire pour sécuriser votre accès. Le mot de passe provisoire vous a été transmis séparément, en dehors de cet email.

Si vous n'étiez pas au courant de cette création de compte, ignorez ce message et prévenez l'équipe Mboka.

À bientôt,
L'équipe Mboka Budget`;

  return sendTransactionalEmail({ to: input.email, subject, text: body });
}
