import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { idbCache, STORES } from "@/lib/indexeddb-cache";
import { flushQueuedMutations, listQueuedMutations, type OfflineMutation } from "@/lib/offline-queue";
import { supabase } from "@/integrations/supabase/client";

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingMutations: number;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncStatus {
  const qc = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingMutations, setPendingMutations] = useState(0);

  const replayMutation = useCallback(async (mutation: OfflineMutation) => {
    const { error } = await (supabase.rpc as any)(mutation.kind, mutation.payload);
    if (error) throw error;
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      toast.info("No hay conexión a internet para sincronizar.");
      return;
    }

    setIsSyncing(true);
    try {
      const queueResult = await flushQueuedMutations(replayMutation);
      setPendingMutations(queueResult.pending);
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
  }, [qc, replayMutation]);

  useEffect(() => {
    // Load last sync timestamp from IndexedDB
    void listQueuedMutations().then((items) => setPendingMutations(items.length));
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
  }, [syncNow]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    pendingMutations,
    syncNow,
  };
}
