import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { isoDate, longText, shortText } from "../schemas";
import { snapshotEntity } from "../versions";

const SLOT_OFFSETS = [
  { type: "MD-4", offset: 0 },
  { type: "MD-3", offset: 1 },
  { type: "MD-2", offset: 2 },
  { type: "MD-1", offset: 3 },
  { type: "MD", offset: 4 },
] as const;

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export default defineAuthedTool({
  name: "create_microcycle",
  title: "Create microcycle",
  description: "Create a weekly football microcycle and its MD-4 to match-day planning slots for the signed-in coach.",
  inputSchema: {
    name: shortText(120).describe("Microcycle name."),
    weekStart: isoDate.describe("First planning date in YYYY-MM-DD format."),
    matchDay: z.enum(["sabado", "domingo"]).describe("Whether the competitive fixture is on Saturday or Sunday."),
    weeklyObjective: longText(600).optional().describe("Primary outcome for the week."),
    notes: longText(2000).optional().describe("Context, constraints or load notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const { data: microcycle, error } = await supabase
      .from("microcycles")
      .insert({
        owner_id: userId,
        name: input.name,
        week_start: input.weekStart,
        match_day: input.matchDay,
        weekly_objective: input.weeklyObjective ?? null,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

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
      return toolError("backend_error", slotsError.message);
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "microcycle",
      entityId: microcycle.id,
      row: microcycle as unknown as Record<string, unknown>,
      label: "created",
    });
    return toolSuccess(
      `Created microcycle “${microcycle.name}” with ${slots.length} planning slots (version ${version}).`,
      { microcycle, slots, version },
    );
  },
});
