import { describe, it, expect, beforeEach } from "vitest";
import { appStore } from "@/stores/app-store";

describe("Global App Store & State Management", () => {
  beforeEach(() => {
    appStore.resetFilters();
  });

  it("updates and retrieves global preferences", () => {
    appStore.updatePreferences({ compactView: true, defaultMatchDay: "saturday" });
    const state = appStore.getState();
    expect(state.preferences.compactView).toBe(true);
    expect(state.preferences.defaultMatchDay).toBe("saturday");
  });

  it("updates and resets exercise filters correctly", () => {
    appStore.updateExerciseFilters({
      searchQuery: "rondos",
      gamePhase: "ataque_organizado",
      onlyFavorites: true,
    });
    let state = appStore.getState();
    expect(state.exerciseFilters.searchQuery).toBe("rondos");
    expect(state.exerciseFilters.gamePhase).toBe("ataque_organizado");
    expect(state.exerciseFilters.onlyFavorites).toBe(true);

    appStore.resetFilters();
    state = appStore.getState();
    expect(state.exerciseFilters.searchQuery).toBe("");
    expect(state.exerciseFilters.gamePhase).toBe("all");
    expect(state.exerciseFilters.onlyFavorites).toBe(false);
  });

  it("notifies listeners on state changes", () => {
    let notified = 0;
    const unsubscribe = appStore.subscribe(() => {
      notified++;
    });

    appStore.updatePreferences({ theme: "system" });
    expect(notified).toBe(1);

    unsubscribe();
    appStore.updatePreferences({ theme: "dark" });
    expect(notified).toBe(1);
  });
});
