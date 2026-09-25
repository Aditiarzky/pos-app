import { openDB } from "idb";

export const offlineDb = openDB("pos-offline-v1", 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("products")) {
      db.createObjectStore("products", { keyPath: "variantId" });
    }
    if (!db.objectStoreNames.contains("salesQueue")) {
      db.createObjectStore("salesQueue", { keyPath: "clientRequestId" });
    }
    if (!db.objectStoreNames.contains("syncLog")) {
      db.createObjectStore("syncLog", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("metadata")) {
      db.createObjectStore("metadata", { keyPath: "key" });
    }
  },
});
