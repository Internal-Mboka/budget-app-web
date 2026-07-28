"use client";

import { useEffect } from "react";

import { MbokaErrorFallback } from "@/components/organisms/mboka-error-fallback";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard:error]", error);
  }, [error]);

  return (
    <MbokaErrorFallback
      title="Le dashboard est momentanément indisponible"
      description="Les indicateurs n'ont pas pu être chargés. Réessayez dans quelques instants."
      error={error}
      onRetry={reset}
      testId="dashboard-route-error"
    />
  );
}
