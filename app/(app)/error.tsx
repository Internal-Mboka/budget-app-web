"use client";

import { useEffect } from "react";

import { MbokaErrorFallback } from "@/components/organisms/mboka-error-fallback";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <MbokaErrorFallback
      error={error}
      onRetry={reset}
      testId="app-route-error"
    />
  );
}
