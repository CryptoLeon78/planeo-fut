import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_session",
  title: "Create session",
  description: "Create a football training session for the signed-in coach with its date, objective and planned load.",
  inputSchema: {
    name: z.string().trim().describe("Session name."),
    objective: z.string().trim().optional().describe("Main coaching objective."),
    sessionDate: z.string().optional().describe("Planned date in YYYY-MM-DD format."),
    durationMinutes: z.number().int().optional().describe("Total planned duration in minutes."),
    intensity: z.enum(["baja", "media", "alta", "muy_alta"]).optional().describe("Planned session intensity: baja, media, alta or muy_alta."),
    weeklyFocus: z.string().trim().optional().describe("Weekly tactical or physical focus."),
    notes: z.string().trim().optional().describe("Organisation and coaching notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("sessions")
      .insert({
        owner_id: userId,
        name: input.name,
        objective: input.objective || null,
        session_date: input.sessionDate || null,
        duration_min: input.durationMinutes ?? null,
        intensity: input.intensity ?? null,
        weekly_focus: input.weeklyFocus || null,
        notes: input.notes || null,
      })
      .select("id,name,objective,session_date,duration_min,intensity")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Created session “${data.name}”.` }], structuredContent: { session: data } };
  },
});