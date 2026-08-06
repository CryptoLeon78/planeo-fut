import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { isoDate, limitField } from "../schemas";

export default defineAuthedTool({
  name: "list_sessions",
  title: "List sessions",
  description: "List the signed-in coach's football training sessions with objectives, dates, load and evaluation details.",
  inputSchema: {
    fromDate: isoDate.optional().describe("Optional inclusive start date in YYYY-MM-DD format."),
    toDate: isoDate.optional().describe("Optional inclusive end date in YYYY-MM-DD format."),
    limit: limitField(50, 20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fromDate, toDate, limit }, ctx, userId) => {
    if (fromDate && toDate && fromDate > toDate) {
      return toolError("invalid_arguments", "fromDate must be earlier than or equal to toDate.");
    }
    let query = supabaseForUser(ctx)
      .from("sessions")
      .select("id,name,objective,session_date,duration_min,intensity,weekly_focus,notes,evaluation,is_template")
      .eq("owner_id", userId)
      .order("session_date", { ascending: false, nullsFirst: false })
      .limit(limit ?? 20);
    if (fromDate) query = query.gte("session_date", fromDate);
    if (toDate) query = query.lte("session_date", toDate);
    const { data, error } = await query;
    if (error) return toolError("backend_error", error.message);
    const items = data ?? [];
    return toolSuccess(`Found ${items.length} sessions.`, { items, count: items.length });
  },
});
