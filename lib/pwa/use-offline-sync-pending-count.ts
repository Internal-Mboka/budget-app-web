"use client";

import { useEffect, useState } from "react";

import { countOfflineSyncQueueItems } from "@/lib/pwa/offline-sync-db";
import { OFFLINE_SYNC_UPDATED_EVENT } from "@/lib/pwa/offline-sync-events";

export function useOfflineSyncPendingCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refreshCount() {
      const pending = await countOfflineSyncQueueItems();

      if (!cancelled) {
        setCount(pending);
      }
    }

    void refreshCount();

    function handleUpdate() {
      void refreshCount();
    }

    window.addEventListener(OFFLINE_SYNC_UPDATED_EVENT, handleUpdate);
    window.addEventListener("online", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(OFFLINE_SYNC_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("online", handleUpdate);
    };
  }, []);

  return count;
}
