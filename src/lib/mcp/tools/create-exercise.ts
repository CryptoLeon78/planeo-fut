import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { longText, shortText } from "../schemas";
import { snapshotEntity } from "../versions";

export default defineAuthedTool({
  name: "create_exercise",
  title: "Create exercise",
  description: "Create a complete football practice in the signed-in coach's library for later session planning.",
  inputSchema: {
    name: shortText(120).describe("Clear football practice name."),
    objective: longText(600).optional().describe("Coaching objective or intended outcome."),
    durationMinutes: z.number().int().min(1).max(240).optional().describe("Planned duration in minutes (1-240)."),
    playersCount: z.number().int().min(1).max(40).optional().describe("Recommended number of players (1-40)."),
    space: shortText(120).optional().describe("Pitch dimensions or working area."),
    materials: longText(600).optional().describe("Required equipment."),
    observations: longText(2000).optional().describe("Organisation, coaching points and constraints."),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).optional().describe("Short searchable labels (max 20)."),
    favourite: z.boolean().optional().describe("Mark the exercise as a favourite."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("exercises")
      .insert({
        owner_id: userId,
        name: input.name,
        objective: input.objective ?? null,
        duration_min: input.durationMinutes ?? null,
        players_count: input.playersCount ?? null,
        space: input.space ?? null,
        materials: input.materials ?? null,
        observations: input.observations ?? null,
        tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
        is_favorite: input.favourite ?? false,
      })
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: "exercise",
      entityId: data.id,
      row: data as unknown as Record<string, unknown>,
      label: "created",
    });
    return toolSuccess(`Created exercise “${data.name}” (version ${version}).`, { exercise: data, version });
  },
});
