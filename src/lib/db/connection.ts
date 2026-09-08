import { openDB, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION, type FinanceDBSchema } from "./schema";

let dbPromise: Promise<IDBPDatabase<FinanceDBSchema>> | null = null;

export function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export function getDB(): Promise<IDBPDatabase<FinanceDBSchema>> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  if (!dbPromise) {
    dbPromise = openDB<FinanceDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // v1 -> v2 dropped the per-app categories store and added per-user
        // scoping to every store; local dev data isn't worth migrating.
        if (oldVersion > 0 && oldVersion < 2) {
          for (const name of Array.from(db.objectStoreNames)) {
            db.deleteObjectStore(name);
          }
        }

        if (!db.objectStoreNames.contains("transactions")) {
          const store = db.createObjectStore("transactions", { keyPath: "id" });
          store.createIndex("by-user", "userId");
          store.createIndex("by-user-date", ["userId", "date"]);
          store.createIndex("by-user-category", ["userId", "categoryId"]);
          store.createIndex("by-user-type", ["userId", "type"]);
        }
        if (!db.objectStoreNames.contains("budgets")) {
          const store = db.createObjectStore("budgets", { keyPath: "id" });
          store.createIndex("by-user", "userId");
          store.createIndex("by-user-category", ["userId", "categoryId"]);
        }
        if (!db.objectStoreNames.contains("recurringExpenses")) {
          const store = db.createObjectStore("recurringExpenses", { keyPath: "id" });
          store.createIndex("by-user", "userId");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}
