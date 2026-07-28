import {
  addOfflineSyncQueueItem,
  listOfflineSyncQueueItems,
  removeOfflineSyncQueueItem,
  updateOfflineSyncQueueItemError,
  type OfflineSyncQueueItem,
} from "@/lib/pwa/offline-sync-db";
import { notifyOfflineSyncUpdated } from "@/lib/pwa/offline-sync-events";

export type OfflineSyncProcessResult = {
  synced: number;
  failed: number;
  syncedCodes: string[];
  errors: string[];
};

function serializeFormData(formData: FormData): Record<string, string> {
  const entries: Record<string, string> = {};

  formData.forEach((value, key) => {
    if (typeof value === "string") {
      entries[key] = value;
    }
  });

  return entries;
}

export function formEntriesToFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
}

function createQueueItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueueRevenueForm(
  form: HTMLFormElement,
  clientLabel: string
): Promise<OfflineSyncQueueItem> {
  const formData = new FormData(form);
  const item: OfflineSyncQueueItem = {
    id: createQueueItemId(),
    kind: "revenue",
    formData: serializeFormData(formData),
    clientLabel,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };

  await addOfflineSyncQueueItem(item);
  notifyOfflineSyncUpdated();
  await registerOfflineBackgroundSync();

  return item;
}

export async function registerOfflineBackgroundSync(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (!("sync" in registration)) {
      return;
    }

    await (
      registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }
    ).sync.register("mboka-revenue-sync");
  } catch (error) {
    console.warn("[pwa:offline-sync] background sync registration failed", error);
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function processOfflineSyncQueue(): Promise<OfflineSyncProcessResult> {
  const result: OfflineSyncProcessResult = {
    synced: 0,
    failed: 0,
    syncedCodes: [],
    errors: [],
  };

  if (typeof window !== "undefined" && !navigator.onLine) {
    return result;
  }

  const items = await listOfflineSyncQueueItems();

  for (const item of items) {
    if (item.kind !== "revenue") {
      continue;
    }

    try {
      const response = await fetch("/api/revenues", {
        method: "POST",
        body: formEntriesToFormData(item.formData),
        credentials: "same-origin",
      });

      const payload = (await response.json()) as
        | { success: true; transaction: { code: string } }
        | { success: false; error: string };

      if (!response.ok || !payload.success) {
        const error =
          payload.success === false ? payload.error : "Impossible d'envoyer la saisie en attente.";
        await updateOfflineSyncQueueItemError(item.id, error);
        result.failed += 1;
        result.errors.push(error);
        continue;
      }

      await removeOfflineSyncQueueItem(item.id);
      result.synced += 1;
      result.syncedCodes.push(payload.transaction.code);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur réseau lors de la synchronisation.";
      await updateOfflineSyncQueueItemError(item.id, message);
      result.failed += 1;
      result.errors.push(message);
    }
  }

  notifyOfflineSyncUpdated();
  return result;
}
