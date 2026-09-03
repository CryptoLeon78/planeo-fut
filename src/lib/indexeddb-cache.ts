/**
 * Native IndexedDB Storage Engine for Smart Local Caching and Offline Resilience
 */

const DB_NAME = "planeofut_db";
const DB_VERSION = 1;

export const STORES = {
  QUERY_CACHE: "query_cache",
  ENTITY_CACHE: "entity_cache",
  SYNC_METADATA: "sync_metadata",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export interface CachedEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
}

export interface CachedEntity<T = unknown> {
  id: string;
  entity: string;
  data: T;
  updatedAt: string;
  version?: number;
}

class IndexedDbCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error("IndexedDB is not supported in this environment"));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.QUERY_CACHE)) {
          db.createObjectStore(STORES.QUERY_CACHE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(STORES.ENTITY_CACHE)) {
          const store = db.createObjectStore(STORES.ENTITY_CACHE, { keyPath: "id" });
          store.createIndex("by_entity", "entity", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
          db.createObjectStore(STORES.SYNC_METADATA, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        this.dbPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a key-value entry into an object store
   */
  async set<T>(storeName: StoreName, key: string, value: T, ttlMs?: number): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const entry: CachedEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };
      store.put(entry);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[IndexedDbCache] Failed to set ${key} in ${storeName}:`, e);
    }
  }

  /**
   * Retrieve a key-value entry from an object store
   */
  async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      return new Promise<T | null>((resolve, reject) => {
        request.onsuccess = () => {
          const entry = request.result as CachedEntry<T> | undefined;
          if (!entry) {
            resolve(null);
            return;
          }
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            // Expired, delete asynchronously
            this.delete(storeName, key);
            resolve(null);
            return;
          }
          resolve(entry.value);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn(`[IndexedDbCache] Failed to get ${key} from ${storeName}:`, e);
      return null;
    }
  }

  /**
   * Delete an entry from an object store
   */
  async delete(storeName: StoreName, key: string): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[IndexedDbCache] Failed to delete ${key} from ${storeName}:`, e);
    }
  }

  /**
   * Retrieve all entries from an object store
   */
  async getAll<T>(storeName: StoreName): Promise<CachedEntry<T>[]> {
    if (!this.isSupported()) return [];
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      return new Promise<CachedEntry<T>[]>((resolve, reject) => {
        request.onsuccess = () => {
          const now = Date.now();
          const valid = (request.result as CachedEntry<T>[]).filter(
            (entry) => !entry.expiresAt || entry.expiresAt > now
          );
          resolve(valid);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn(`[IndexedDbCache] Failed to getAll from ${storeName}:`, e);
      return [];
    }
  }

  /**
   * Clear all entries in a store
   */
  async clear(storeName: StoreName): Promise<void> {
    if (!this.isSupported()) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.clear();
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[IndexedDbCache] Failed to clear ${storeName}:`, e);
    }
  }
}

export const idbCache = new IndexedDbCache();

/**
 * Deterministic Conflict Resolution (Timestamp / Version based)
 */
export function resolveConflict<T extends { updated_at?: string; created_at?: string; version?: number }>(
  localItem: T,
  serverItem: T
): { resolved: T; winner: "local" | "server" } {
  // If version numbers are present
  if (localItem.version != null && serverItem.version != null) {
    if (localItem.version > serverItem.version) {
      return { resolved: localItem, winner: "local" };
    }
    return { resolved: serverItem, winner: "server" };
  }

  // Fallback to ISO timestamps
  const localTime = new Date(localItem.updated_at || localItem.created_at || 0).getTime();
  const serverTime = new Date(serverItem.updated_at || serverItem.created_at || 0).getTime();

  if (localTime > serverTime) {
    return { resolved: localItem, winner: "local" };
  }
  return { resolved: serverItem, winner: "server" };
}
