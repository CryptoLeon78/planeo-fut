import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { entityEnum, shortText, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity } from "../versions";

export default defineAuthedTool({
  name: "delete_record",
  title: "Delete exercise, session or microcycle",
  description:
    "Archive (soft delete) one of the coach's practices, sessions or microcycles. The record stops appearing in the app but a version snapshot is kept, so it can be brought back with restore_deleted_record.",
  inputSchema: {
    entity: entityEnum.describe("What to delete: exercise, session or microcycle."),
    recordId: uuid.describe("Identifier of the record to delete."),
    reason: shortText(160).optional().describe("Optional note explaining why it was deleted."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ entity, recordId, reason }, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const current = await fetchOwnedRow(supabase, entity, recordId, userId);
    if (!current) {
      return toolError("not_found", "No active record with that identifier belongs to you.");
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity,
      entityId: recordId,
      row: current,
      label: reason ? `before-delete: ${reason}` : "before-delete",
    });

    const { data, error } = await supabase
      .from(ENTITY_TABLE[entity])
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", recordId)
      .eq("owner_id", userId)
      .select("id,name,deleted_at")
      .single();
    if (error) return toolError("backend_error", error.message);

    return toolSuccess(
      `Deleted ${entity} “${String((data as unknown as Record<string, unknown>).name)}”; state saved as version ${version} and recoverable.`,
      { record: data, backupVersion: version, softDeleted: true },
    );
  },
});
