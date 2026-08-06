import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { intensityEnum, isoDate, longText, shortText, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity } from "../versions";

const nullableText = (max: number) => longText(max).nullable().optional();

export default defineAuthedTool({
  name: "update_exercise",
  title: "Update exercise",
  description: "Update fields of an existing practice in the coach's library, storing a version snapshot before the change.",
  inputSchema: {
    exerciseId: uuid.describe("Identifier of the exercise to update."),
    name: shortText(120).optional().describe("New practice name."),
    objective: nullableText(600).describe("New coaching objective; pass null to clear."),
    durationMinutes: z.number().int().min(1).max(240).nullable().optional().describe("New duration in minutes."),
    playersCount: z.number().int().min(1).max(40).nullable().optional().describe("New recommended player count."),
    space: nullableText(120).describe("New working area."),
    materials: nullableText(600).describe("New equipment list."),
    observations: nullableText(2000).describe("New coaching points."),
    intensity: intensityEnum.optional().describe("New intensity: baja, media, alta or muy_alta."),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).optional().describe("Replacement list of labels."),
    favourite: z.boolean().optional().describe("Mark or unmark as favourite."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const current = await fetchOwnedRow(supabase, "exercise", input.exerciseId, userId);
    if (!current) return toolError("not_found", "No exercise with that identifier belongs to you.");

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.objective !== undefined) patch.objective = input.objective;
    if (input.durationMinutes !== undefined) patch.duration_min = input.durationMinutes;
    if (input.playersCount !== undefined) patch.players_count = input.playersCount;
    if (input.space !== undefined) patch.space = input.space;
    if (input.materials !== undefined) patch.materials = input.materials;
    if (input.observations !== undefined) patch.observations = input.observations;
    if (input.intensity !== undefined) patch.intensity = input.intensity;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.favourite !== undefined) patch.is_favorite = input.favourite;
    if (Object.keys(patch).length === 0) {
      return toolError("invalid_arguments", "Provide at least one field to update.");
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "exercise",
      entityId: input.exerciseId,
      row: current,
      label: "before-update",
    });

    const { data, error } = await supabase
      .from(ENTITY_TABLE.exercise)
      .update(patch as never)
      .eq("id", input.exerciseId)
      .eq("owner_id", userId)
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);
    return toolSuccess(`Updated exercise “${data.name}”; previous state saved as version ${version}.`, {
      exercise: data,
      previousVersion: version,
    });
  },
});
