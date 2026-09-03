import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { idbCache, STORES } from "@/lib/indexeddb-cache";

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncStatus {
  const qc = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Load last sync timestamp from IndexedDB
    idbCache
      .get<{ timestamp: number }>(STORES.SYNC_METADATA, "last_query_cache_save")
      .then((meta) => {
        if (meta?.timestamp) {
          setLastSyncedAt(new Date(meta.timestamp));
        }
      });

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restablecida. Sincronizando datos...");
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sin conexión. Usando datos locales en caché (IndexedDB).");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      toast.info("No hay conexión a internet para sincronizar.");
      return;
    }

    setIsSyncing(true);
    try {
      await qc.refetchQueries({ type: "active" });
      const now = new Date();
      setLastSyncedAt(now);
      await idbCache.set(STORES.SYNC_METADATA, "last_query_cache_save", {
        timestamp: now.getTime(),
      });
    } catch (e) {
      console.warn("Error during manual sync:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [qc]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    syncNow,
  };
}
