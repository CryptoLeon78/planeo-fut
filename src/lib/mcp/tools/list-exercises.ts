import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { limitField } from "../schemas";

export default defineAuthedTool({
  name: "list_exercises",
  title: "List exercises",
  description: "Find football practices in the signed-in coach's private library, including favourites and planning details.",
  inputSchema: {
    search: z.string().trim().min(1).max(80).optional().describe("Optional text found in the exercise name or objective."),
    favouritesOnly: z.boolean().optional().describe("Return only exercises marked as favourites."),
    limit: limitField(50, 20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, favouritesOnly, limit }, ctx, userId) => {
    let query = supabaseForUser(ctx)
      .from("exercises")
      .select("id,name,objective,game_phase,intensity,task_type,duration_min,players_count,space,materials,tags,is_favorite,observations,variants,updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);
    if (favouritesOnly) query = query.eq("is_favorite", true);
    if (search) {
      const term = search.replaceAll(",", " ").replaceAll("%", "");
      query = query.or(`name.ilike.%${term}%,objective.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) return toolError("backend_error", error.message);
    const items = data ?? [];
    return toolSuccess(
      items.length ? `Found ${items.length} exercises.` : "No matching exercises found.",
      { items, count: items.length },
    );
  },
});
