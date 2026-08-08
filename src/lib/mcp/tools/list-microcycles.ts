import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { isoDate, limitField } from "../schemas";

export default defineAuthedTool({
  name: "list_microcycles",
  title: "List microcycles",
  description: "List weekly football microcycles and their MD slots for the signed-in coach.",
  inputSchema: {
    fromWeek: isoDate.optional().describe("Optional earliest week start in YYYY-MM-DD format."),
    limit: limitField(20, 10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fromWeek, limit }, ctx, userId) => {
    let query = supabaseForUser(ctx)
      .from("microcycles")
      .select("id,name,week_start,match_day,weekly_objective,notes,mesocycle_id,microcycle_slots(id,slot_type,slot_date,notes,session_id)")
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .order("week_start", { ascending: false })
      .limit(limit ?? 10);
    if (fromWeek) query = query.gte("week_start", fromWeek);
    const { data, error } = await query;
    if (error) return toolError("backend_error", error.message);
    const items = data ?? [];
    return toolSuccess(`Found ${items.length} microcycles.`, { items, count: items.length });
  },
});
