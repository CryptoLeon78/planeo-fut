import { table, unwrap } from "./client";

export type SessionRow = Record<string, any>;

export const sessionsRepository = {
  async list(): Promise<SessionRow[]> {
    const data = await unwrap(
      await table("sessions").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
    );
    return data ?? [];
  },

  async listRecent(limit = 5): Promise<SessionRow[]> {
    const data = await unwrap(
      await table("sessions")
        .select("id,name,objective,session_date,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit),
    );
    return data ?? [];
  },

  async count(): Promise<number> {
    const res = await table("sessions").select("id", { count: "exact", head: true }).is("deleted_at", null);
    return res.count ?? 0;
  },

  async getById(id: string): Promise<SessionRow | null> {
    return unwrap(await table("sessions").select("*").eq("id", id).maybeSingle());
  },

  async create(payload: SessionRow): Promise<SessionRow> {
    return unwrap(await table("sessions").insert(payload).select("*").single());
  },

  async update(id: string, patch: SessionRow): Promise<void> {
    unwrap(await table("sessions").update(patch).eq("id", id));
  },

  async remove(id: string): Promise<void> {
    unwrap(await table("sessions").delete().eq("id", id));
  },

  async listBlocks(sessionId: string): Promise<SessionRow[]> {
    const data = await unwrap(
      await table("session_blocks").select("*").eq("session_id", sessionId).order("position"),
    );
    return data ?? [];
  },

  async createBlocks(blocks: SessionRow[]): Promise<SessionRow[]> {
    if (blocks.length === 0) return [];
    const data = await unwrap(await table("session_blocks").insert(blocks).select("id,position,block_type"));
    return data ?? [];
  },

  async listBlockExercises(blockIds: string[]): Promise<SessionRow[]> {
    if (blockIds.length === 0) return [];
    const data = await unwrap(
      await table("session_block_exercises")
        .select("*, exercises(name, duration_min, game_phase, image_url)")
        .in("block_id", blockIds)
        .order("position"),
    );
    return data ?? [];
  },

  async listExercisesOfBlock(blockId: string): Promise<SessionRow[]> {
    const data = await unwrap(await table("session_block_exercises").select("*").eq("block_id", blockId));
    return data ?? [];
  },

  async createBlockExercises(rows: SessionRow[]): Promise<void> {
    if (rows.length === 0) return;
    unwrap(await table("session_block_exercises").insert(rows));
  },
};
