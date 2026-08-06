import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { isoDate, longText, shortText, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity } from "../versions";

export default defineAuthedTool({
  name: "update_microcycle",
  title: "Update microcycle",
  description: "Update a weekly microcycle header and optionally assign a session to one of its MD slots.",
  inputSchema: {
    microcycleId: uuid.describe("Identifier of the microcycle to update."),
    name: shortText(120).optional().describe("New microcycle name."),
    weekStart: isoDate.optional().describe("New first planning date in YYYY-MM-DD format."),
    matchDay: z.enum(["sabado", "domingo"]).optional().describe("New fixture day."),
    weeklyObjective: longText(600).nullable().optional().describe("New weekly objective; pass null to clear."),
    notes: longText(2000).nullable().optional().describe("New notes; pass null to clear."),
    assignSession: z
      .object({
        slotType: z.enum(["MD-4", "MD-3", "MD-2", "MD-1", "MD"]).describe("Slot to fill."),
        sessionId: uuid.nullable().describe("Session to assign, or null to clear the slot."),
      })
      .optional()
      .describe("Optionally assign or clear a training session in one planning slot."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const current = await fetchOwnedRow(supabase, "microcycle", input.microcycleId, userId);
    if (!current) return toolError("not_found", "No microcycle with that identifier belongs to you.");

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.weekStart !== undefined) patch.week_start = input.weekStart;
    if (input.matchDay !== undefined) patch.match_day = input.matchDay;
    if (input.weeklyObjective !== undefined) patch.weekly_objective = input.weeklyObjective;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (Object.keys(patch).length === 0 && !input.assignSession) {
      return toolError("invalid_arguments", "Provide at least one field to update or a slot assignment.");
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "microcycle",
      entityId: input.microcycleId,
      row: current,
      label: "before-update",
    });

    let microcycle = current;
    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase
        .from(ENTITY_TABLE.microcycle)
        .update(patch as never)
        .eq("id", input.microcycleId)
        .eq("owner_id", userId)
        .select("*")
        .single();
      if (error) return toolError("backend_error", error.message);
      microcycle = data as unknown as Record<string, unknown>;
    }

    let slot: unknown = null;
    if (input.assignSession) {
      const { sessionId, slotType } = input.assignSession;
      if (sessionId) {
        const owned = await fetchOwnedRow(supabase, "session", sessionId, userId);
        if (!owned) return toolError("not_found", "The session to assign does not belong to you.");
        // Free the session from any slot it already occupies to avoid conflicts.
        const { data: microcycleSlots } = await supabase
          .from("microcycle_slots")
          .select("id")
          .eq("microcycle_id", input.microcycleId);
        const ids = (microcycleSlots ?? []).map((row) => row.id);
        if (ids.length) {
          await supabase.from("microcycle_slots").update({ session_id: null }).in("id", ids).eq("session_id", sessionId);
        }
      }
      const { data, error } = await supabase
        .from("microcycle_slots")
        .update({ session_id: sessionId })
        .eq("microcycle_id", input.microcycleId)
        .eq("slot_type", slotType)
        .select("id,slot_type,slot_date,session_id")
        .maybeSingle();
      if (error) return toolError("backend_error", error.message);
      if (!data) return toolError("not_found", `The microcycle has no ${slotType} slot.`);
      slot = data;
    }

    return toolSuccess(`Updated microcycle; previous state saved as version ${version}.`, {
      microcycle,
      slot,
      previousVersion: version,
    });
  },
});
