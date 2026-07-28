const DB_NAME = "mboka-offline-sync-v1";
const STORE_NAME = "queue";
const SYNC_TAG = "mboka-revenue-sync";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllItems(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function deleteItem(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(undefined);
  });
}

function entriesToFormData(entries) {
  const formData = new FormData();

  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

async function syncPendingRevenues() {
  const db = await openDb();

  try {
    const items = await getAllItems(db);

    for (const item of items) {
      if (!item || item.kind !== "revenue") {
        continue;
      }

      const response = await fetch("/api/revenues", {
        method: "POST",
        body: entriesToFormData(item.formData),
        credentials: "same-origin",
      });

      const payload = await response.json();

      if (response.ok && payload.success) {
        await deleteItem(db, item.id);
      }
    }
  } finally {
    db.close();
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingRevenues());
  }
});
