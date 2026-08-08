import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type VersionedEntity = "exercise" | "session" | "microcycle";

export const ENTITY_TABLE: Record<VersionedEntity, "exercises" | "sessions" | "microcycles"> = {
  exercise: "exercises",
  session: "sessions",
  microcycle: "microcycles",
};

type Client = SupabaseClient<Database>;

/** Immutable fields that must never be overwritten when restoring a snapshot. */
const PROTECTED_FIELDS = ["id", "owner_id", "created_at", "updated_at"] as const;

export function stripProtectedFields(row: Record<string, unknown>) {
  const copy: Record<string, unknown> = { ...row };
  for (const field of PROTECTED_FIELDS) delete copy[field];
  return copy;
}

export async function fetchOwnedRow(
  supabase: Client,
  entity: VersionedEntity,
  id: string,
  ownerId: string,
  options?: { includeDeleted?: boolean },
) {
  let query = supabase
    .from(ENTITY_TABLE[entity])
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (!options?.includeDeleted) query = query.is("deleted_at", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

/** Stores a snapshot of the current row and returns the new version number. */
export async function snapshotEntity(
  supabase: Client,
  options: {
    ownerId: string;
    entity: VersionedEntity;
    entityId: string;
    row: Record<string, unknown>;
    label?: string;
    source?: string;
  },
): Promise<number> {
  const { data: last } = await supabase
    .from("entity_versions")
    .select("version")
    .eq("entity_id", options.entityId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = ((last?.version as number | undefined) ?? 0) + 1;
  const { error } = await supabase.from("entity_versions").insert({
    owner_id: options.ownerId,
    entity_type: options.entity,
    entity_id: options.entityId,
    version,
    label: options.label ?? null,
    source: options.source ?? "mcp",
    snapshot: options.row as never,
  });
  if (error) throw new Error(error.message);
  return version;
}
