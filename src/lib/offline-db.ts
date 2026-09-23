
import { openDB } from "idb";

export const offlineDb = openDB("pos-offline-v1", 1, {
  upgrade(db) {
    db.createObjectStore("products", { keyPath: "variantId" });
    db.createObjectStore("salesQueue", { keyPath: "clientRequestId" });
    db.createObjectStore("syncLog", { keyPath: "id", autoIncrement: true });
  },
});