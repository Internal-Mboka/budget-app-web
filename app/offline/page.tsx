import type { Metadata } from "next";

import { OfflineFallbackScreen } from "@/components/organisms/offline-fallback-screen";

export const metadata: Metadata = {
  title: "Hors ligne · Mboka Budget",
  description: "Mboka Budget est temporairement indisponible sans connexion internet.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineFallbackScreen />;
}
