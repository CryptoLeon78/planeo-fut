import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SLOT_OFFSETS = [
  { type: "MD-4", offset: 0 },
  { type: "MD-3", offset: 1 },
  { type: "MD-2", offset: 2 },
  { type: "MD-1", offset: 3 },
  { type: "MD", offset: 4 },
] as const;

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export default defineTool({
  name: "create_microcycle",
  title: "Create microcycle",
  description: "Create a weekly football microcycle and its MD-4 to match-day planning slots for the signed-in coach.",
  inputSchema: {
    name: z.string().trim().describe("Microcycle name."),
    weekStart: z.string().describe("First planning date in YYYY-MM-DD format."),
    matchDay: z.enum(["sabado", "domingo"]).describe("Whether the competitive fixture is on Saturday or Sunday."),
    weeklyObjective: z.string().trim().optional().describe("Primary outcome for the week."),
    notes: z.string().trim().optional().describe("Context, constraints or load notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: microcycle, error } = await supabase
      .from("microcycles")
      .insert({
        owner_id: userId,
        name: input.name,
        week_start: input.weekStart,
        match_day: input.matchDay,
        weekly_objective: input.weeklyObjective || null,
        notes: input.notes || null,
      })
      .select("id,name,week_start,match_day,weekly_objective")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const { data: slots, error: slotsError } = await supabase
      .from("microcycle_slots")
      .insert(SLOT_OFFSETS.map((slot) => ({
        microcycle_id: microcycle.id,
        slot_type: slot.type,
        slot_date: addDays(input.weekStart, slot.offset),
      })))
      .select("id,slot_type,slot_date");
    if (slotsError) {
      await supabase.from("microcycles").delete().eq("id", microcycle.id).eq("owner_id", userId);
      return { content: [{ type: "text", text: slotsError.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Created microcycle “${microcycle.name}” with ${slots.length} planning slots.` }],
      structuredContent: { microcycle, slots },
    };
  },
});