export type OfflineSyncQueueItem = {
  id: string;
  kind: "revenue";
  formData: Record<string, string>;
  clientLabel: string;
  queuedAt: string;
  attempts: number;
  lastError?: string;
};

const DB_NAME = "mboka-offline-sync-v1";
const STORE_NAME = "queue";
const DB_VERSION = 1;

function openOfflineSyncDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openOfflineSyncDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = callback(store);

        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        request.onsuccess = () => resolve(request.result as T);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      })
  );
}

export async function listOfflineSyncQueueItems(): Promise<OfflineSyncQueueItem[]> {
  if (typeof indexedDB === "undefined") {
    return [];
  }

  return runTransaction("readonly", (store) => store.getAll());
}

export async function countOfflineSyncQueueItems(): Promise<number> {
  const items = await listOfflineSyncQueueItems();
  return items.length;
}

export async function addOfflineSyncQueueItem(
  item: OfflineSyncQueueItem
): Promise<void> {
  await runTransaction("readwrite", (store) => store.put(item));
}

export async function removeOfflineSyncQueueItem(id: string): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(id));
}

export async function updateOfflineSyncQueueItemError(
  id: string,
  lastError: string
): Promise<void> {
  const items = await listOfflineSyncQueueItems();
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    return;
  }

  await addOfflineSyncQueueItem({
    ...item,
    attempts: item.attempts + 1,
    lastError,
  });
}
