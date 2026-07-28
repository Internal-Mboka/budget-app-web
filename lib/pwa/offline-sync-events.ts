export const OFFLINE_SYNC_UPDATED_EVENT = "mboka-offline-sync-updated";

export function notifyOfflineSyncUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OFFLINE_SYNC_UPDATED_EVENT));
}
