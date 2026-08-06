import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { intensityEnum, isoDate, longText, shortText } from "../schemas";
import { snapshotEntity } from "../versions";

export default defineAuthedTool({
  name: "create_session",
  title: "Create session",
  description: "Create a football training session for the signed-in coach with its date, objective and planned load.",
  inputSchema: {
    name: shortText(120).describe("Session name."),
    objective: longText(600).optional().describe("Main coaching objective."),
    sessionDate: isoDate.optional().describe("Planned date in YYYY-MM-DD format."),
    durationMinutes: z.number().int().min(15).max(240).optional().describe("Total planned duration in minutes (15-240)."),
    intensity: intensityEnum.optional().describe("Planned session intensity: baja, media, alta or muy_alta."),
    weeklyFocus: shortText(160).optional().describe("Weekly tactical or physical focus."),
    notes: longText(2000).optional().describe("Organisation and coaching notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        owner_id: userId,
        name: input.name,
        objective: input.objective ?? null,
        session_date: input.sessionDate ?? null,
        duration_min: input.durationMinutes ?? null,
        intensity: input.intensity ?? null,
        weekly_focus: input.weeklyFocus ?? null,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "session",
      entityId: data.id,
      row: data as unknown as Record<string, unknown>,
      label: "created",
    });
    return toolSuccess(`Created session “${data.name}” (version ${version}).`, { session: data, version });
  },
});
