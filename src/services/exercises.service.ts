import { supabase } from '@/integrations/supabase/client';
import { OSO_EXERCISES, type OsoExercise } from '@/data/oso-exercises';

export async function listExercises() {
  try {
    const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[exercises.service] Error fetching exercises from DB, returning OSO exercises:', error.message);
      return OSO_EXERCISES as any;
    }

    const dbItems = data ?? [];
    // If DB has items, combine DB exercises with OSO exercises (avoiding duplicate IDs)
    const dbIds = new Set(dbItems.map((item: any) => item.id));
    const uniqueOso = OSO_EXERCISES.filter((oso) => !dbIds.has(oso.id));

    return [...dbItems, ...uniqueOso];
  } catch {
    return OSO_EXERCISES as any;
  }
}

export function listOsoExercises(): OsoExercise[] {
  return OSO_EXERCISES;
}

export function getOsoExerciseById(id: string): OsoExercise | undefined {
  return OSO_EXERCISES.find((ex) => ex.id === id);
}

export async function setExerciseFavorite(id: string, isFavorite: boolean) {
  const { error } = await (supabase.from('exercises') as any).update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
}
