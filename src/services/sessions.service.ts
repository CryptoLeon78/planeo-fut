import { sessionsRepository, type SessionRow } from "@/api/sessions.repository";

export const sessionsService = {
  list: () => sessionsRepository.list(),
  listRecent: (limit?: number) => sessionsRepository.listRecent(limit),
  remove: (id: string) => sessionsRepository.remove(id),

  /** Loads a session with its blocks and the exercises inside each block. */
  async getDetail(id: string) {
    const session = await sessionsRepository.getById(id);
    const blocks = await sessionsRepository.listBlocks(id);
    const items = await sessionsRepository.listBlockExercises(blocks.map((b) => b.id));
    return { session, blocks, items };
  },

  /**
   * Duplicates a session: copies the header, its blocks and the exercises of
   * each block, clearing the scheduled date so the copy is reusable.
   */
  async duplicate(id: string): Promise<SessionRow | null> {
    const src = await sessionsRepository.getById(id);
    if (!src) return null;
    const blocks = await sessionsRepository.listBlocks(id);

    const created = await sessionsRepository.create({
      owner_id: src.owner_id,
      team_id: src.team_id,
      name: `${src.name} (copia)`,
      session_date: null,
      objective: src.objective,
      weekly_focus: src.weekly_focus,
      intensity: src.intensity,
      duration_min: src.duration_min,
      notes: src.notes,
      is_template: src.is_template,
    });

    if (blocks.length > 0) {
      const insertedBlocks = await sessionsRepository.createBlocks(
        blocks.map((b) => ({
          session_id: created.id,
          block_type: b.block_type,
          name: b.name,
          position: b.position,
          duration_min: b.duration_min,
          notes: b.notes,
        })),
      );

      for (const originalBlock of blocks) {
        const newBlock = insertedBlocks.find(
          (x) => x.position === originalBlock.position && x.block_type === originalBlock.block_type,
        );
        if (!newBlock) continue;
        const exercises = await sessionsRepository.listExercisesOfBlock(originalBlock.id);
        await sessionsRepository.createBlockExercises(
          exercises.map((e) => ({
            block_id: newBlock.id,
            exercise_id: e.exercise_id,
            position: e.position,
            duration_override: e.duration_override,
            notes: e.notes,
          })),
        );
      }
    }

    return created;
  },
};
