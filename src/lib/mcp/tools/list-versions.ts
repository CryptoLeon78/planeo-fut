import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { entityEnum, limitField, uuid } from "../schemas";

export default defineAuthedTool({
  name: "list_versions",
  title: "List version history",
  description: "List stored version snapshots for one of the coach's practices, sessions or microcycles.",
  inputSchema: {
    entity: entityEnum.describe("Record type: exercise, session or microcycle."),
    recordId: uuid.describe("Identifier of the record."),
    limit: limitField(50, 20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ entity, recordId, limit }, ctx, userId) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("entity_versions")
      .select("id,version,label,source,created_at,snapshot")
      .eq("owner_id", userId)
      .eq("entity_type", entity)
      .eq("entity_id", recordId)
      .order("version", { ascending: false })
      .limit(limit ?? 20);
    if (error) return toolError("backend_error", error.message);
    const items = data ?? [];
    return toolSuccess(`Found ${items.length} versions.`, { items, count: items.length });
  },
});
