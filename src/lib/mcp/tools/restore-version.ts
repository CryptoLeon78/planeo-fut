import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { entityEnum, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity, stripProtectedFields } from "../versions";

export default defineAuthedTool({
  name: "restore_version",
  title: "Restore a previous version",
  description: "Roll a practice, session or microcycle back to a stored version snapshot, keeping the current state as a new version.",
  inputSchema: {
    entity: entityEnum.describe("Record type: exercise, session or microcycle."),
    recordId: uuid.describe("Identifier of the record to roll back."),
    version: z.number().int().min(1).describe("Version number to restore."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ entity, recordId, version }, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const current = await fetchOwnedRow(supabase, entity, recordId, userId);
    if (!current) return toolError("not_found", "No record with that identifier belongs to you.");

    const { data: snapshotRow, error: snapshotError } = await supabase
      .from("entity_versions")
      .select("snapshot")
      .eq("owner_id", userId)
      .eq("entity_type", entity)
      .eq("entity_id", recordId)
      .eq("version", version)
      .maybeSingle();
    if (snapshotError) return toolError("backend_error", snapshotError.message);
    if (!snapshotRow) return toolError("not_found", `Version ${version} does not exist for this record.`);

    const backup = await snapshotEntity(supabase, {
      ownerId: userId,
      entity,
      entityId: recordId,
      row: current,
      label: `before-restore:${version}`,
    });

    const patch = stripProtectedFields(snapshotRow.snapshot as Record<string, unknown>);
    const { data, error } = await supabase
      .from(ENTITY_TABLE[entity])
      .update(patch as never)
      .eq("id", recordId)
      .eq("owner_id", userId)
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

    return toolSuccess(`Restored version ${version}; the previous state is version ${backup}.`, {
      record: data,
      restoredVersion: version,
      backupVersion: backup,
    });
  },
});
