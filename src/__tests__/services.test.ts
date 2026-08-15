import { describe, it, expect } from "vitest";
import { filterExercises } from "@/services/exercises.service";
import { buildSlots, slotOffsetsFor } from "@/services/microcycles.service";
import { validateMesocycleInput, defaultPreseasonPhases } from "@/services/planning.service";
import { toEvaluationPayload, emptyEvaluation } from "@/services/session-evaluations.service";

describe("exercises service", () => {
  const rows = [
    { id: "1", name: "Rondo 4v2", objective: "Salida", tags: ["posesion"], game_phase: "ataque", intensity: "alta", is_favorite: true },
    { id: "2", name: "Presión tras pérdida", objective: null, tags: [], game_phase: "defensa", intensity: "media", is_favorite: false },
  ];

  it("filters by free text across name, objective and tags", () => {
    expect(filterExercises(rows, { query: "rondo" }).map((r) => r.id)).toEqual(["1"]);
    expect(filterExercises(rows, { query: "posesion" }).map((r) => r.id)).toEqual(["1"]);
  });

  it("filters by phase, intensity and favourites", () => {
    expect(filterExercises(rows, { phase: "defensa" }).map((r) => r.id)).toEqual(["2"]);
    expect(filterExercises(rows, { intensity: "alta" }).map((r) => r.id)).toEqual(["1"]);
    expect(filterExercises(rows, { onlyFavorites: true }).map((r) => r.id)).toEqual(["1"]);
    expect(filterExercises(rows, { phase: "all", intensity: "all" })).toHaveLength(2);
  });
});

describe("microcycles service", () => {
  it("places the match on Saturday or Sunday", () => {
    expect(slotOffsetsFor("sabado").at(-1)).toEqual(["MD", 5]);
    expect(slotOffsetsFor("domingo").at(-1)).toEqual(["MD", 6]);
  });

  it("builds five dated slots from the week start", () => {
    const slots = buildSlots("m1", "2026-08-10", "sabado");
    expect(slots).toHaveLength(5);
    expect(slots[0]).toMatchObject({ microcycle_id: "m1", slot_type: "MD-4", slot_date: "2026-08-11" });
    expect(slots[4]).toMatchObject({ slot_type: "MD", slot_date: "2026-08-15" });
  });
});

describe("planning service", () => {
  const base = { ownerId: "u1", name: "Pretemporada", startDate: "2026-07-01", endDate: "2026-08-01" };

  it("accepts valid input and rejects bad input", () => {
    expect(validateMesocycleInput(base)).toBeNull();
    expect(validateMesocycleInput({ ...base, name: " " })).toBeTruthy();
    expect(validateMesocycleInput({ ...base, endDate: "" })).toBeTruthy();
    expect(validateMesocycleInput({ ...base, endDate: "2026-06-01" })).toBeTruthy();
  });

  it("provides default preseason phases", () => {
    expect(defaultPreseasonPhases().length).toBeGreaterThan(0);
  });
});

describe("session evaluations service", () => {
  it("normalises empty strings to null in the payload", () => {
    const payload = toEvaluationPayload("s1", "u1", { ...emptyEvaluation, rating: 4 });
    expect(payload).toMatchObject({ session_id: "s1", owner_id: "u1", rating: 4, what_worked: null });
  });
});
