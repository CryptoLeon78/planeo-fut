import { supabase } from '@/integrations/supabase/client';

export async function listSessions() {
  const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateSession(id: string) {
  const { data: source, error: sourceError } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (sourceError) throw sourceError;
  const { data: blocks, error: blocksError } = await supabase.from('session_blocks').select('*').eq('session_id', id);
  if (blocksError) throw blocksError;
  const { data: created, error: createError } = await (supabase.from('sessions') as any).insert({
    owner_id: source.owner_id, team_id: source.team_id, name: `${source.name} (copia)`, session_date: null,
    objective: source.objective, weekly_focus: source.weekly_focus, intensity: source.intensity,
    duration_min: source.duration_min, notes: source.notes, is_template: source.is_template,
  }).select('id').single();
  if (createError || !created) throw createError ?? new Error('No se pudo crear la copia');

  if (blocks?.length) {
    const newBlocks = blocks.map((block: any) => ({ session_id: created.id, block_type: block.block_type, name: block.name, position: block.position, duration_min: block.duration_min, notes: block.notes }));
    const { data: insertedBlocks, error: insertBlocksError } = await (supabase.from('session_blocks') as any).insert(newBlocks).select('id,position,block_type');
    if (insertBlocksError) throw insertBlocksError;
    for (const block of blocks) {
      const newBlock = insertedBlocks?.find((candidate: any) => candidate.position === block.position && candidate.block_type === block.block_type);
      if (!newBlock) continue;
      const { data: exercises, error: exercisesError } = await supabase.from('session_block_exercises').select('*').eq('block_id', block.id);
      if (exercisesError) throw exercisesError;
      if (exercises?.length) {
        const { error } = await (supabase.from('session_block_exercises') as any).insert(exercises.map((exercise: any) => ({ block_id: newBlock.id, exercise_id: exercise.exercise_id, position: exercise.position, duration_override: exercise.duration_override, notes: exercise.notes })));
        if (error) throw error;
      }
    }
  }
  return created.id as string;
}
