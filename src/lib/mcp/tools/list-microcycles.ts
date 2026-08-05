import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_microcycles",
  title: "List microcycles",
  description: "List weekly football microcycles and their MD slots for the signed-in coach.",
  inputSchema: {
    fromWeek: z.string().optional().describe("Optional earliest week start in YYYY-MM-DD format."),
    limit: z.number().int().optional().describe("Maximum microcycles to return; values are clamped between 1 and 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fromWeek, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };
    let query = supabaseForUser(ctx)
      .from("microcycles")
      .select("id,name,week_start,match_day,weekly_objective,notes,mesocycle_id,microcycle_slots(id,slot_type,slot_date,notes,session_id)")
      .eq("owner_id", userId)
      .order("week_start", { ascending: false })
      .limit(Math.min(20, Math.max(1, limit ?? 10)));
    if (fromWeek) query = query.gte("week_start", fromWeek);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return { content: [{ type: "text", text: `Found ${items.length} microcycles.` }], structuredContent: { items, count: items.length } };
  },
});