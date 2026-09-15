import { describe, it, expect } from "vitest";
import { OSO_EXERCISES, getOsoExerciseById } from "@/data/oso-exercises";
import { OSO_TEMPLATES } from "@/data/oso-templates";
import { listExercises } from "@/services/exercises.service";

describe("Metodología OSO Data & Services", () => {
  it("contains curated exercises across all age stages", () => {
    expect(OSO_EXERCISES.length).toBeGreaterThanOrEqual(8);
    const stages = new Set(OSO_EXERCISES.map((e) => e.ageStage));
    expect(stages.has("6-7")).toBe(true);
    expect(stages.has("8-9")).toBe(true);
    expect(stages.has("10-13")).toBe(true);
    expect(stages.has("14-18")).toBe(true);
  });

  it("retrieves a specific exercise by ID with full OSO metadata", () => {
    const exercise = getOsoExerciseById("oso-pb-01");
    expect(exercise).toBeDefined();
    expect(exercise?.name).toContain("Rondo 6x0");
    expect(exercise?.provocationRule).toBeDefined();
    expect(exercise?.focosFutbolisticos).toBe("Percepción + Posición");
  });

  it("contains structured session templates for all age categories", () => {
    expect(OSO_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    const template = OSO_TEMPLATES[0];
    expect(template.parts.length).toBeGreaterThanOrEqual(3);
    expect(template.closingQuestion).toBeTruthy();
  });

  it("merges OSO exercises in listExercises service", async () => {
    const all = await listExercises();
    expect(all.length).toBeGreaterThanOrEqual(OSO_EXERCISES.length);
  });
});
