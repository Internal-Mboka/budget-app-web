"use server";

import { signIn, signOut } from "@/lib/auth/instance";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { error: "invalid-credentials" as const };
  }

  return {
    success: true as const,
    redirectTo: callbackUrl || "/",
  };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
