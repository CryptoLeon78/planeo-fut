import { idbCache, STORES } from "@/lib/indexeddb-cache";

export type OfflineMutationKind = "save_session_graph" | "create_microcycle_with_slots";

export interface OfflineMutation {
  id: string;
  kind: OfflineMutationKind;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

function key(id: string) {
  return `mutation:${id}`;
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueueMutation(
  mutation: Omit<OfflineMutation, "id" | "createdAt" | "attempts"> & { id?: string },
): Promise<OfflineMutation> {
  const value: OfflineMutation = {
    id: mutation.id ?? createId(),
    kind: mutation.kind,
    payload: mutation.payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await idbCache.set(STORES.MUTATION_QUEUE, key(value.id), value);
  return value;
}

export async function listQueuedMutations(): Promise<OfflineMutation[]> {
  const entries = await idbCache.getAll<OfflineMutation>(STORES.MUTATION_QUEUE);
  return entries
    .map((entry) => entry.value)
    .filter(Boolean)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueuedMutation(id: string): Promise<void> {
  await idbCache.delete(STORES.MUTATION_QUEUE, key(id));
}

export async function flushQueuedMutations(
  executor: (mutation: OfflineMutation) => Promise<void>,
): Promise<{ processed: number; pending: number }> {
  let processed = 0;
  for (const mutation of await listQueuedMutations()) {
    try {
      await executor(mutation);
      await removeQueuedMutation(mutation.id);
      processed += 1;
    } catch (error) {
      await idbCache.set(STORES.MUTATION_QUEUE, key(mutation.id), {
        ...mutation,
        attempts: mutation.attempts + 1,
        lastError: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }
  return { processed, pending: (await listQueuedMutations()).length };
}
