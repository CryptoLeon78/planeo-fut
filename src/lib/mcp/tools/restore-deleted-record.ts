import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { entityEnum, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow } from "../versions";

export default defineAuthedTool({
  name: "restore_deleted_record",
  title: "Restore a deleted record",
  description: "Bring back a practice, session or microcycle that was soft deleted, together with its version history.",
  inputSchema: {
    entity: entityEnum.describe("Record type: exercise, session or microcycle."),
    recordId: uuid.describe("Identifier of the deleted record."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ entity, recordId }, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const row = await fetchOwnedRow(supabase, entity, recordId, userId, { includeDeleted: true });
    if (!row) return toolError("not_found", "No record with that identifier belongs to you.");
    if (!row.deleted_at) return toolError("conflict", "That record is not deleted.");

    const { data, error } = await supabase
      .from(ENTITY_TABLE[entity])
      .update({ deleted_at: null } as never)
      .eq("id", recordId)
      .eq("owner_id", userId)
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

    return toolSuccess(`Restored ${entity} “${String((data as unknown as Record<string, unknown>).name)}”.`, {
      record: data,
    });
  },
});
