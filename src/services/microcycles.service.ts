import { microcyclesRepository, type MicrocycleRow } from "@/api/microcycles.repository";
import { addDays, ymd } from "@/lib/constants";

export type MatchDay = "sabado" | "domingo";

/**
 * Weekly periodisation rule: training slots run MD-4 → MD-1 and the match day
 * lands on Saturday (offset 5) or Sunday (offset 6) from the Monday week start.
 */
export function slotOffsetsFor(matchDay: MatchDay): ReadonlyArray<readonly [string, number]> {
  return matchDay === "sabado"
    ? ([["MD-4", 1], ["MD-3", 2], ["MD-2", 3], ["MD-1", 4], ["MD", 5]] as const)
    : ([["MD-4", 1], ["MD-3", 2], ["MD-2", 3], ["MD-1", 5], ["MD", 6]] as const);
}

export function buildSlots(microcycleId: string, weekStart: string, matchDay: MatchDay) {
  const base = new Date(weekStart);
  return slotOffsetsFor(matchDay).map(([slotType, offset]) => ({
    microcycle_id: microcycleId,
    slot_type: slotType,
    slot_date: ymd(addDays(base, offset)),
    session_id: null,
    notes: null,
  }));
}

export const microcyclesService = {
  list: () => microcyclesRepository.list(),
  getById: (id: string) => microcyclesRepository.getById(id),
  listSlots: (id: string) => microcyclesRepository.listSlots(id),
  remove: (id: string) => microcyclesRepository.remove(id),

  /** Creates a microcycle and auto-generates its MD slots. */
  async create(input: {
    ownerId: string;
    name: string;
    weekStart: string;
    matchDay: MatchDay;
    weeklyObjective?: string | null;
    mesocycleId?: string | null;
  }): Promise<MicrocycleRow> {
    const created = await microcyclesRepository.create({
      owner_id: input.ownerId,
      name: input.name,
      week_start: input.weekStart,
      match_day: input.matchDay,
      weekly_objective: input.weeklyObjective || null,
      mesocycle_id: input.mesocycleId ?? null,
    });
    await microcyclesRepository.createSlots(buildSlots(created.id, input.weekStart, input.matchDay));
    return created;
  },

  /**
   * Assigns a session to a slot. A session can only live in one slot at a
   * time, so any previous slot holding it is cleared (conflict resolution).
   */
  async assignSession(microcycleId: string, slotId: string, sessionId: string | null): Promise<void> {
    if (sessionId) {
      const slots = await microcyclesRepository.listSlots(microcycleId);
      const conflicting = slots.filter((s) => s.session_id === sessionId && s.id !== slotId);
      for (const slot of conflicting) await microcyclesRepository.updateSlot(slot.id, { session_id: null });
    }
    await microcyclesRepository.updateSlot(slotId, { session_id: sessionId });
  },

  /** Clones a microcycle one week later, keeping its slot structure. */
  async duplicate(id: string): Promise<MicrocycleRow | null> {
    const src = await microcyclesRepository.getById(id);
    if (!src) return null;
    const slots = await microcyclesRepository.listSlots(id);

    const nextStart = addDays(new Date(src.week_start), 7);
    const created = await microcyclesRepository.create({
      owner_id: src.owner_id,
      team_id: src.team_id,
      mesocycle_id: src.mesocycle_id,
      name: `${src.name} (copia)`,
      week_start: ymd(nextStart),
      match_day: src.match_day,
      weekly_objective: src.weekly_objective,
      notes: src.notes,
    });

    await microcyclesRepository.createSlots(
      slots.map((s) => ({
        microcycle_id: created.id,
        slot_type: s.slot_type,
        slot_date: ymd(addDays(new Date(s.slot_date), 7)),
        session_id: s.session_id,
        notes: s.notes,
      })),
    );

    return created;
  },
};
