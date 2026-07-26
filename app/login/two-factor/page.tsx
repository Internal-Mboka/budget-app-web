import { Suspense } from "react";
import { redirect } from "next/navigation";

import { TwoFactorLoginForm } from "@/components/organisms/two-factor-login-form";
import { getTwoFactorChallengeEmail } from "@/lib/actions/two-factor";

export default async function TwoFactorLoginPage() {
  const email = await getTwoFactorChallengeEmail();

  if (!email) {
    redirect("/login");
  }

  return (
    <Suspense fallback={null}>
      <TwoFactorLoginForm email={email} />
    </Suspense>
  );
}
