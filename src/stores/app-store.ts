import { useSyncExternalStore } from "react";

export interface AppPreferences {
  theme: "dark" | "system";
  compactView: boolean;
  defaultMatchDay: "saturday" | "sunday";
  exerciseViewMode: "grid" | "list";
  activeCategoryFilter: string;
  rememberLastFilters: boolean;
}

export interface ExerciseFilterState {
  searchQuery: string;
  gamePhase: string;
  intensity: string;
  onlyFavorites: boolean;
}

export interface AppState {
  preferences: AppPreferences;
  exerciseFilters: ExerciseFilterState;
  activeTeamId: string | null;
}

const STORAGE_KEY = "planeofut_app_state_v1";

const DEFAULT_STATE: AppState = {
  preferences: {
    theme: "dark",
    compactView: false,
    defaultMatchDay: "sunday",
    exerciseViewMode: "grid",
    activeCategoryFilter: "all",
    rememberLastFilters: true,
  },
  exerciseFilters: {
    searchQuery: "",
    gamePhase: "all",
    intensity: "all",
    onlyFavorites: false,
  },
  activeTeamId: null,
};

function loadStoredState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_STATE.preferences, ...(parsed.preferences ?? {}) },
      exerciseFilters: { ...DEFAULT_STATE.exerciseFilters, ...(parsed.exerciseFilters ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

let currentState: AppState = loadStoredState();
const listeners = new Set<() => void>();

function persistState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist app state:", e);
  }
}

export const appStore = {
  getState(): AppState {
    return currentState;
  },

  setState(updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) {
    const patch = typeof updater === "function" ? updater(currentState) : updater;
    currentState = {
      ...currentState,
      ...patch,
      preferences: patch.preferences
        ? { ...currentState.preferences, ...patch.preferences }
        : currentState.preferences,
      exerciseFilters: patch.exerciseFilters
        ? { ...currentState.exerciseFilters, ...patch.exerciseFilters }
        : currentState.exerciseFilters,
    };
    persistState(currentState);
    listeners.forEach((listener) => listener());
  },

  updatePreferences(patch: Partial<AppPreferences>) {
    appStore.setState((prev) => ({
      preferences: { ...prev.preferences, ...patch },
    }));
  },

  updateExerciseFilters(patch: Partial<ExerciseFilterState>) {
    appStore.setState((prev) => ({
      exerciseFilters: { ...prev.exerciseFilters, ...patch },
    }));
  },

  resetFilters() {
    appStore.setState({
      exerciseFilters: { ...DEFAULT_STATE.exerciseFilters },
    });
  },

  setActiveTeamId(teamId: string | null) {
    appStore.setState({ activeTeamId: teamId });
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/**
 * React hook to access and subscribe to the global AppState.
 */
export function useAppStore<T = AppState>(selector: (state: AppState) => T = (s) => s as unknown as T): T {
  const slice = useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(DEFAULT_STATE)
  );
  return slice;
}

/**
 * Specialized hook for user & UI preferences
 */
export function useAppPreferences() {
  const preferences = useAppStore((s) => s.preferences);
  return {
    preferences,
    updatePreferences: appStore.updatePreferences,
  };
}

/**
 * Specialized hook for exercise library filter state
 */
export function useExerciseFilters() {
  const filters = useAppStore((s) => s.exerciseFilters);
  return {
    filters,
    setFilters: appStore.updateExerciseFilters,
    resetFilters: appStore.resetFilters,
  };
}
