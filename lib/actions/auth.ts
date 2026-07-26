"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth/instance";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();

  try {
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
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "invalid-credentials" as const };
    }

    console.error("Login action failed", error);
    return { error: "server-error" as const };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
