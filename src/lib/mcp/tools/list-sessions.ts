import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sessions",
  title: "List sessions",
  description: "List the signed-in coach's football training sessions with objectives, dates, load and evaluation details.",
  inputSchema: {
    fromDate: z.string().optional().describe("Optional inclusive start date in YYYY-MM-DD format."),
    toDate: z.string().optional().describe("Optional inclusive end date in YYYY-MM-DD format."),
    limit: z.number().int().optional().describe("Maximum records to return; values are clamped between 1 and 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fromDate, toDate, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };
    let query = supabaseForUser(ctx)
      .from("sessions")
      .select("id,name,objective,session_date,duration_min,intensity,weekly_focus,notes,evaluation,is_template")
      .eq("owner_id", userId)
      .order("session_date", { ascending: false, nullsFirst: false })
      .limit(Math.min(50, Math.max(1, limit ?? 20)));
    if (fromDate) query = query.gte("session_date", fromDate);
    if (toDate) query = query.lte("session_date", toDate);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return { content: [{ type: "text", text: `Found ${items.length} sessions.` }], structuredContent: { items, count: items.length } };
  },
});