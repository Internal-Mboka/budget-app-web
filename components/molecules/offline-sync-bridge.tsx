"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { processOfflineSyncQueue } from "@/lib/pwa/offline-sync-queue";
import { useNetworkStatus } from "@/lib/pwa/use-network-status";

function formatSyncSuccessMessage(synced: number, codes: string[]): string {
  if (synced === 1) {
    const code = codes[0];
    return code
      ? `Revenu envoyé avec succès (${code}).`
      : "1 saisie en attente a été envoyée avec succès.";
  }

  return `${synced} saisies en attente ont été envoyées avec succès.`;
}

export function OfflineSyncBridge() {
  const networkStatus = useNetworkStatus();
  const isSyncingRef = useRef(false);
  const lastProcessedReconnectRef = useRef(false);

  useEffect(() => {
    if (networkStatus !== "reconnected") {
      if (networkStatus === "offline") {
        lastProcessedReconnectRef.current = false;
      }

      return;
    }

    if (lastProcessedReconnectRef.current || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    lastProcessedReconnectRef.current = true;

    void processOfflineSyncQueue()
      .then((result) => {
        if (result.synced > 0) {
          toast.success(formatSyncSuccessMessage(result.synced, result.syncedCodes));
        }

        if (result.failed > 0) {
          const detail = result.errors[0] ?? "Vérifiez la saisie puis réessayez.";
          toast.error(
            result.failed === 1
              ? `1 saisie n'a pas pu être envoyée : ${detail}`
              : `${result.failed} saisies n'ont pas pu être envoyées.`
          );
        }
      })
      .finally(() => {
        isSyncingRef.current = false;
      });
  }, [networkStatus]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) {
      return;
    }

    void processOfflineSyncQueue();
  }, []);

  return null;
}
