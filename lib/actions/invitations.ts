"use server";

import { AuthError } from "next-auth";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { signIn } from "@/lib/auth/instance";
import { notifyUserInvited } from "@/lib/email/account-notifications";
import { notifyPasswordChanged } from "@/lib/email/security-notifications";
import { acceptInvitation } from "@/lib/invitations/service";
import { acceptInvitationSchema } from "@/lib/validations/invitation";

export type InvitationActionResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function acceptInvitationAction(
  formData: FormData
): Promise<InvitationActionResult> {
  const parsed = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { token, newPassword } = parsed.data;

  let acceptedUser: { userId: string; email: string; firstName: string };

  try {
    acceptedUser = await acceptInvitation({ rawToken: token, newPassword });
  } catch {
    return { success: false, error: "Lien d'invitation invalide ou expiré." };
  }

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "INVITATION_ACCEPTED",
    entity: "User",
    entityId: acceptedUser.userId,
    userId: acceptedUser.userId,
    details: {
      email: acceptedUser.email,
    },
  });

  await notifyPasswordChanged({
    email: acceptedUser.email,
    firstName: acceptedUser.firstName,
    context: "invitation_accepted",
  });

  try {
    const result = await signIn("credentials", {
      email: acceptedUser.email,
      password: newPassword,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: true,
        redirectTo: "/login?message=invitation-accepted",
      };
    }

    return { success: true, redirectTo: "/" };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: true,
        redirectTo: "/login?message=invitation-accepted",
      };
    }

    console.error("Invitation accept sign-in failed", error);
    return { success: false, error: "Compte activé, mais la connexion automatique a échoué." };
  }
}

export async function sendInvitationEmail(input: {
  email: string;
  firstName: string;
  inviterName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresAt: Date;
}): Promise<boolean> {
  return notifyUserInvited({
    email: input.email,
    firstName: input.firstName,
    inviterName: input.inviterName,
    roleLabel: input.roleLabel,
    inviteUrl: input.inviteUrl,
    expiresAt: input.expiresAt,
  });
}
