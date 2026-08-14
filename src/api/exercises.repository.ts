import { table, unwrap } from "./client";

export type ExerciseRow = Record<string, any>;

export const exercisesRepository = {
  async list(): Promise<ExerciseRow[]> {
    const data = await unwrap(
      await table("exercises")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    );
    return data ?? [];
  },

  async getById(id: string): Promise<ExerciseRow | null> {
    return unwrap(await table("exercises").select("*").eq("id", id).maybeSingle());
  },

  async count(): Promise<number> {
    const res = await table("exercises").select("id", { count: "exact", head: true }).is("deleted_at", null);
    return res.count ?? 0;
  },

  async create(payload: ExerciseRow): Promise<ExerciseRow> {
    return unwrap(await table("exercises").insert(payload).select("*").single());
  },

  async update(id: string, patch: ExerciseRow): Promise<void> {
    unwrap(await table("exercises").update(patch).eq("id", id));
  },

  async setFavorite(id: string, isFavorite: boolean): Promise<void> {
    unwrap(await table("exercises").update({ is_favorite: isFavorite }).eq("id", id));
  },

  async remove(id: string): Promise<void> {
    unwrap(await table("exercises").delete().eq("id", id));
  },
};
