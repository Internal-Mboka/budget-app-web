"use client";

import { WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function PwaNetworkStatus() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline || pathname === "/offline") {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] border-b border-amber-200 bg-amber-50/95 px-4 py-2 text-center text-sm text-amber-950 backdrop-blur dark:border-amber-900 dark:bg-amber-950/90 dark:text-amber-100"
      role="status"
      data-testid="pwa-network-offline-banner"
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <WifiOff className="size-4 shrink-0" aria-hidden />
        Connexion perdue — certaines actions seront indisponibles jusqu&apos;au retour du réseau.
      </span>
    </div>
  );
}
