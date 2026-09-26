import { describe, it, expect } from "vitest";
import { FORMATIONS, buildFormationElements } from "@/lib/tactical-board-formations";

describe("FORMATIONS", () => {
  it("cada formación tiene 11 posiciones (portero + 10) únicas", () => {
    for (const formation of FORMATIONS) {
      expect(formation.slots).toHaveLength(11);
      const keys = new Set(formation.slots.map((s) => `${s.x},${s.y}`));
      expect(keys.size).toBe(11);
    }
  });

  it("todas las posiciones están dentro del rango 0-100", () => {
    for (const formation of FORMATIONS) {
      for (const slot of formation.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.x).toBeLessThanOrEqual(100);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("buildFormationElements", () => {
  it("genera 11 piezas 'player' numeradas 1-11 en las coordenadas originales", () => {
    const elements = buildFormationElements("4-4-2", "player", "#38bdf8");
    expect(elements).toHaveLength(11);
    expect(elements.map((e) => e.label)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
    expect(elements.every((e) => e.type === "player" && e.color === "#38bdf8")).toBe(true);
    expect(elements[0]).toMatchObject({ x: 6, y: 50 });
  });

  it("espeja la X para el rival manteniendo la Y", () => {
    const formation = FORMATIONS.find((f) => f.id === "4-3-3")!;
    const elements = buildFormationElements("4-3-3", "opponent", "#fb7185");
    expect(elements.every((e) => e.type === "opponent")).toBe(true);
    elements.forEach((e, i) => {
      expect(e.x).toBeCloseTo(100 - formation.slots[i].x);
      expect(e.y).toBe(formation.slots[i].y);
    });
  });

  it("devuelve ids únicos entre sí", () => {
    const elements = buildFormationElements("3-5-2", "player", "#38bdf8");
    expect(new Set(elements.map((e) => e.id)).size).toBe(11);
  });

  it("devuelve un array vacío para un id de formación desconocido", () => {
    expect(buildFormationElements("no-existe", "player", "#38bdf8")).toEqual([]);
  });
});
