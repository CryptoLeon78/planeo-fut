import { describe, it, expect } from "vitest";
import { generateSeedData } from "../../scripts/seed-oso-data";

describe("Seed OSO Data Generator", () => {
  it("generates categories, exercises, and templates with complete OSO schema", () => {
    const seed = generateSeedData();
    expect(seed.categoriesCount).toBe(4);
    expect(seed.exercisesCount).toBeGreaterThanOrEqual(8);
    expect(seed.templatesCount).toBeGreaterThanOrEqual(4);

    const firstExercise = seed.exercises[0];
    expect(firstExercise.name).toBeTruthy();
    expect(firstExercise.provocation_rule).toBeDefined();

    const firstTemplate = seed.templates[0];
    expect(firstTemplate.name).toBeTruthy();
    expect(firstTemplate.content.parts).toBeDefined();
  });
});
