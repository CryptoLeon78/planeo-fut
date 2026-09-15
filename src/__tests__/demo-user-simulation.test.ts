import { describe, it, expect } from "vitest";
import { generateUserDemoWorkflow } from "../../scripts/demo-user-simulation";

describe("User Demo Simulation", () => {
  it("generates a complete, consistent user workflow with all domain elements", () => {
    const demo = generateUserDemoWorkflow();

    // 1. Coach & Team
    expect(demo.coach.name).toBe("Carlos Méndez");
    expect(demo.team.name).toBe("Olympic Alevín A");

    // 2. Roster & Injuries
    expect(demo.roster.length).toBe(12);
    expect(demo.injury.playerName).toBe("Diego Navarro");

    // 3. Exercise & Session
    expect(demo.exercise.id).toBe("oso-inf-02");
    expect(demo.session.blocks.length).toBe(4);

    // 4. Microcycle & Mesocycle
    expect(demo.microcycle.slots.length).toBe(5);
    expect(demo.mesocycle.name).toContain("Fundamentos Posicionales");

    // 5. Evaluation & Backup
    expect(demo.evaluation.rpeRating).toBe(7.5);
    expect(demo.backupPackage.entitiesCount).toBeGreaterThan(0);
  });
});
