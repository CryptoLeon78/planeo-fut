import { table, unwrap } from "./client";

export type MicrocycleRow = Record<string, any>;

export const microcyclesRepository = {
  async list(): Promise<MicrocycleRow[]> {
    const data = await unwrap(
      await table("microcycles")
        .select("id,name,week_start,match_day,weekly_objective,notes")
        .is("deleted_at", null)
        .order("week_start", { ascending: false }),
    );
    return data ?? [];
  },

  async count(): Promise<number> {
    const res = await table("microcycles").select("id", { count: "exact", head: true }).is("deleted_at", null);
    return res.count ?? 0;
  },

  async getById(id: string): Promise<MicrocycleRow | null> {
    return unwrap(await table("microcycles").select("*").eq("id", id).maybeSingle());
  },

  async create(payload: MicrocycleRow): Promise<MicrocycleRow> {
    return unwrap(await table("microcycles").insert(payload).select("*").single());
  },

  async update(id: string, patch: MicrocycleRow): Promise<void> {
    unwrap(await table("microcycles").update(patch).eq("id", id));
  },

  async remove(id: string): Promise<void> {
    unwrap(await table("microcycles").delete().eq("id", id));
  },

  async listSlots(microcycleId: string): Promise<MicrocycleRow[]> {
    const data = await unwrap(
      await table("microcycle_slots").select("*").eq("microcycle_id", microcycleId).order("slot_date"),
    );
    return data ?? [];
  },

  async createSlots(slots: MicrocycleRow[]): Promise<void> {
    if (slots.length === 0) return;
    unwrap(await table("microcycle_slots").insert(slots));
  },

  async updateSlot(slotId: string, patch: MicrocycleRow): Promise<void> {
    unwrap(await table("microcycle_slots").update(patch).eq("id", slotId));
  },
};
