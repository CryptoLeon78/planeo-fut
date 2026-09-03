import { supabase } from '@/integrations/supabase/client';

export async function listExercises() {
  const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setExerciseFavorite(id: string, isFavorite: boolean) {
  const { error } = await (supabase.from('exercises') as any).update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
}
