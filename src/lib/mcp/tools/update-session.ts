import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { intensityEnum, isoDate, longText, shortText, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity } from "../versions";

export default defineAuthedTool({
  name: "update_session",
  title: "Update session",
  description: "Update an existing training session (date, objective, load or notes), storing a version snapshot first.",
  inputSchema: {
    sessionId: uuid.describe("Identifier of the session to update."),
    name: shortText(120).optional().describe("New session name."),
    objective: longText(600).nullable().optional().describe("New main objective; pass null to clear."),
    sessionDate: isoDate.nullable().optional().describe("New planned date in YYYY-MM-DD format."),
    durationMinutes: z.number().int().min(15).max(240).nullable().optional().describe("New duration in minutes."),
    intensity: intensityEnum.optional().describe("New intensity: baja, media, alta or muy_alta."),
    weeklyFocus: longText(160).nullable().optional().describe("New weekly focus."),
    notes: longText(2000).nullable().optional().describe("New coaching notes."),
    evaluation: longText(2000).nullable().optional().describe("Post-session evaluation summary."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const current = await fetchOwnedRow(supabase, "session", input.sessionId, userId);
    if (!current) return toolError("not_found", "No session with that identifier belongs to you.");

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.objective !== undefined) patch.objective = input.objective;
    if (input.sessionDate !== undefined) patch.session_date = input.sessionDate;
    if (input.durationMinutes !== undefined) patch.duration_min = input.durationMinutes;
    if (input.intensity !== undefined) patch.intensity = input.intensity;
    if (input.weeklyFocus !== undefined) patch.weekly_focus = input.weeklyFocus;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.evaluation !== undefined) patch.evaluation = input.evaluation;
    if (Object.keys(patch).length === 0) {
      return toolError("invalid_arguments", "Provide at least one field to update.");
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "session",
      entityId: input.sessionId,
      row: current,
      label: "before-update",
    });

    const { data, error } = await supabase
      .from(ENTITY_TABLE.session)
      .update(patch as never)
      .eq("id", input.sessionId)
      .eq("owner_id", userId)
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);
    return toolSuccess(`Updated session “${data.name}”; previous state saved as version ${version}.`, {
      session: data,
      previousVersion: version,
    });
  },
});
