import { table, unwrap } from "./client";

export type MesocycleType = "pretemporada" | "temporada";
export type MesocycleRow = Record<string, any>;

export const mesocyclesRepository = {
  async listByType(type: MesocycleType): Promise<MesocycleRow[]> {
    const data = await unwrap(
      await table("mesocycles").select("*").eq("type", type).order("start_date", { ascending: false }),
    );
    return data ?? [];
  },

  async getById(id: string): Promise<MesocycleRow | null> {
    return unwrap(await table("mesocycles").select("*").eq("id", id).maybeSingle());
  },

  async create(payload: MesocycleRow): Promise<MesocycleRow> {
    return unwrap(await table("mesocycles").insert(payload).select("*").single());
  },

  async update(id: string, patch: MesocycleRow): Promise<void> {
    unwrap(await table("mesocycles").update(patch).eq("id", id));
  },

  async remove(id: string): Promise<void> {
    unwrap(await table("mesocycles").delete().eq("id", id));
  },
};

export const seasonEventsRepository = {
  async listByMesocycle(mesocycleId: string): Promise<MesocycleRow[]> {
    const data = await unwrap(
      await table("season_events").select("*").eq("mesocycle_id", mesocycleId).order("event_date"),
    );
    return data ?? [];
  },

  async create(payload: MesocycleRow): Promise<MesocycleRow> {
    return unwrap(await table("season_events").insert(payload).select("*").single());
  },

  async remove(id: string): Promise<void> {
    unwrap(await table("season_events").delete().eq("id", id));
  },
};
