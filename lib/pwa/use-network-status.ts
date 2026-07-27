"use client";

import { useEffect, useRef, useState } from "react";

export type NetworkConnectionStatus = "online" | "offline" | "reconnected";

const RECONNECTED_VISIBLE_MS = 4500;

export function useNetworkStatus(): NetworkConnectionStatus {
  const [status, setStatus] = useState<NetworkConnectionStatus>("online");
  const wasOfflineRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setStatus(navigator.onLine ? "online" : "offline");
    wasOfflineRef.current = !navigator.onLine;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function handleOffline() {
      clearReconnectTimer();
      wasOfflineRef.current = true;
      setStatus("offline");
    }

    function handleOnline() {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setStatus("reconnected");
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          setStatus("online");
        }, RECONNECTED_VISIBLE_MS);
        return;
      }

      setStatus("online");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearReconnectTimer();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}
