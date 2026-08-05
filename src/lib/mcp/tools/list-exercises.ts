import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_exercises",
  title: "List exercises",
  description: "Find football practices in the signed-in coach's private library, including favourites and planning details.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional text found in the exercise name or objective."),
    favouritesOnly: z.boolean().optional().describe("Return only exercises marked as favourites."),
    limit: z.number().int().optional().describe("Maximum records to return; values are clamped between 1 and 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, favouritesOnly, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Authentication required." }], isError: true };
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "The authenticated user has no identifier." }], isError: true };

    let query = supabaseForUser(ctx)
      .from("exercises")
      .select("id,name,objective,game_phase,intensity,task_type,duration_min,players_count,space,materials,tags,is_favorite,observations,variants")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(Math.min(50, Math.max(1, limit ?? 20)));
    if (favouritesOnly) query = query.eq("is_favorite", true);
    if (search) query = query.or(`name.ilike.%${search.replaceAll(",", " ")}%,objective.ilike.%${search.replaceAll(",", " ")}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return {
      content: [{ type: "text", text: items.length ? `Found ${items.length} exercises.` : "No matching exercises found." }],
      structuredContent: { items, count: items.length },
    };
  },
});