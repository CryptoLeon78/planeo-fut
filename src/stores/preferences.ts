import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ExerciseFilters = {
  phase: string;
  intensity: string;
  onlyFavorites: boolean;
};

export type PreferencesState = {
  /** Nº de tarjetas/filas cargadas por página en listados largos. */
  pageSize: number;
  /** Recordar filtros de la biblioteca de ejercicios entre visitas. */
  exerciseFilters: ExerciseFilters;
  setPageSize: (size: number) => void;
  setExerciseFilters: (filters: Partial<ExerciseFilters>) => void;
  resetExerciseFilters: () => void;
};

export const DEFAULT_EXERCISE_FILTERS: ExerciseFilters = {
  phase: "all",
  intensity: "all",
  onlyFavorites: false,
};

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      pageSize: 12,
      exerciseFilters: DEFAULT_EXERCISE_FILTERS,
      setPageSize: (pageSize) => set({ pageSize }),
      setExerciseFilters: (filters) =>
        set((state) => ({ exerciseFilters: { ...state.exerciseFilters, ...filters } })),
      resetExerciseFilters: () => set({ exerciseFilters: DEFAULT_EXERCISE_FILTERS }),
    }),
    { name: "planeofut-preferences", version: 1 },
  ),
);
