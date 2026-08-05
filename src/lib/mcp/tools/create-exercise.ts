import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_exercise",
  title: "Create exercise",
  description: "Create a complete football practice in the signed-in coach's library for later session planning.",
  inputSchema: {
    name: z.string().trim().describe("Clear football practice name."),
    objective: z.string().trim().optional().describe("Coaching objective or intended outcome."),
    durationMinutes: z.number().int().optional().describe("Planned duration in minutes."),
    playersCount: z.number().int().optional().describe("Recommended number of players."),
    space: z.string().trim().optional().describe("Pitch dimensions or working area."),
    materials: z.string().trim().optional().describe("Required equipment."),
    observations: z.string().trim().optional().describe("Organisation, coaching points and constraints."),
    tags: z.array(z.string()).optional().describe("Short searchable labels."),
    favourite: z.boolean().optional().describe("Mark the exercise as a favourite."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };

    const { data, error } = await supabaseForUser(ctx)
      .from("exercises")
      .insert({
        owner_id: userId,
        name: input.name,
        objective: input.objective || null,
        duration_min: input.durationMinutes ?? null,
        players_count: input.playersCount ?? null,
        space: input.space || null,
        materials: input.materials || null,
        observations: input.observations || null,
        tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
        is_favorite: input.favourite ?? false,
      })
      .select("id,name,objective,duration_min,is_favorite")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Created exercise “${data.name}”.` }], structuredContent: { exercise: data } };
  },
});