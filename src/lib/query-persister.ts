import { QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { idbCache, STORES } from "./indexeddb-cache";
import { logger } from "./logger";

const PERSISTENCE_KEY = "tanstack_query_cache_root";
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3; // 3 days max cache retention

let isRestored = false;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Restores dehydrated query state from IndexedDB into QueryClient
 */
export async function restoreQueryCache(queryClient: QueryClient): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const cached = await idbCache.get<any>(STORES.QUERY_CACHE, PERSISTENCE_KEY);
    if (!cached) return false;

    hydrate(queryClient, cached);
    isRestored = true;
    logger.info("Restored TanStack Query cache from IndexedDB", {
      queryCount: cached.queries?.length ?? 0,
    });
    return true;
  } catch (err) {
    logger.warn("Failed to restore query cache from IndexedDB", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Saves current query state to IndexedDB with debounce
 */
export function saveQueryCache(queryClient: QueryClient, debounceMs = 1000) {
  if (typeof window === "undefined") return;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      const dehydrated = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) => {
          // Persist only successful, non-empty queries
          return (
            query.state.status === "success" &&
            query.state.data !== undefined &&
            !query.queryKey.some((k) => typeof k === "string" && k.startsWith("ephemeral_"))
          );
        },
      });

      await idbCache.set(STORES.QUERY_CACHE, PERSISTENCE_KEY, dehydrated, DEFAULT_MAX_AGE_MS);
      await idbCache.set(STORES.SYNC_METADATA, "last_query_cache_save", { timestamp: Date.now() });
    } catch (err) {
      logger.warn("Failed to persist query cache to IndexedDB", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, debounceMs);
}

/**
 * Initializes automatic IndexedDB query persistence and network auto-sync
 */
export function initQueryPersistence(queryClient: QueryClient): () => void {
  if (typeof window === "undefined") return () => {};

  // 1. Initial hydration from IndexedDB
  restoreQueryCache(queryClient);

  // 2. Subscribe to query cache changes to persist
  const unsubscribeCache = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === "updated" && event.query.state.status === "success") {
      saveQueryCache(queryClient);
    }
  });

  // 3. Network reconnection auto-synchronization
  const handleOnline = () => {
    logger.info("Network connection restored. Syncing query cache with backend...");
    queryClient.invalidateQueries({
      type: "active",
      refetchType: "active",
    });
  };

  window.addEventListener("online", handleOnline);

  return () => {
    unsubscribeCache();
    window.removeEventListener("online", handleOnline);
    if (saveTimeout) clearTimeout(saveTimeout);
  };
}

/**
 * Checks if query cache has been restored
 */
export function isQueryCacheRestored(): boolean {
  return isRestored;
}
