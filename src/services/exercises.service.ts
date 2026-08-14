import { exercisesRepository, type ExerciseRow } from "@/api/exercises.repository";

export type ExerciseFilters = {
  query?: string;
  phase?: string;
  intensity?: string;
  onlyFavorites?: boolean;
};

/** Pure business rule: which exercises match the coach's current filters. */
export function filterExercises(exercises: ExerciseRow[], filters: ExerciseFilters): ExerciseRow[] {
  const q = (filters.query ?? "").trim().toLowerCase();
  return exercises.filter((e) => {
    if (filters.onlyFavorites && !e.is_favorite) return false;
    if (filters.phase && filters.phase !== "all" && e.game_phase !== filters.phase) return false;
    if (filters.intensity && filters.intensity !== "all" && e.intensity !== filters.intensity) return false;
    if (q) {
      const haystack = `${e.name ?? ""} ${e.objective ?? ""} ${(e.tags ?? []).join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const exercisesService = {
  list: () => exercisesRepository.list(),
  getById: (id: string) => exercisesRepository.getById(id),
  toggleFavorite: (id: string, current: boolean) => exercisesRepository.setFavorite(id, !current),
  remove: (id: string) => exercisesRepository.remove(id),
};
