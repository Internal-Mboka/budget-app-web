import { LoginForm } from "@/components/organisms/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      callbackUrl={params.callbackUrl}
      initialError={params.error}
      initialMessage={params.message}
    />
  );
}
