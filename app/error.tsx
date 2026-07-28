"use client";

import { useEffect } from "react";

import { MbokaErrorFallback } from "@/components/organisms/mboka-error-fallback";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("[root:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[image:var(--mboka-gradient)] px-4 py-8">
      <MbokaErrorFallback
        title="L'application a rencontré une erreur"
        description="Rechargez cette page ou réessayez. Si le problème persiste, contactez le support technique."
        error={error}
        onRetry={reset}
        testId="root-route-error"
      />
    </div>
  );
}
