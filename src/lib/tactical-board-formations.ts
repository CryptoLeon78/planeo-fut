import type { TacticalElement } from "@/components/tactical-board";

type FormationSlot = { x: number; y: number };

export type Formation = { id: string; label: string; slots: FormationSlot[] };

const GK: FormationSlot = { x: 6, y: 50 };

/** Posiciones relativas (0-100) atacando hacia x=100. El GK siempre es el primer slot. */
export const FORMATIONS: Formation[] = [
  {
    id: "4-4-2",
    label: "4-4-2",
    slots: [GK,
      { x: 18, y: 15 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 85 },
      { x: 45, y: 15 }, { x: 45, y: 38 }, { x: 45, y: 62 }, { x: 45, y: 85 },
      { x: 72, y: 35 }, { x: 72, y: 65 },
    ],
  },
  {
    id: "4-3-3",
    label: "4-3-3",
    slots: [GK,
      { x: 18, y: 15 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 85 },
      { x: 42, y: 30 }, { x: 42, y: 50 }, { x: 42, y: 70 },
      { x: 72, y: 15 }, { x: 72, y: 50 }, { x: 72, y: 85 },
    ],
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: [GK,
      { x: 18, y: 15 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 85 },
      { x: 38, y: 35 }, { x: 38, y: 65 },
      { x: 58, y: 20 }, { x: 58, y: 50 }, { x: 58, y: 80 },
      { x: 78, y: 50 },
    ],
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    slots: [GK,
      { x: 18, y: 25 }, { x: 18, y: 50 }, { x: 18, y: 75 },
      { x: 45, y: 10 }, { x: 45, y: 32 }, { x: 45, y: 50 }, { x: 45, y: 68 }, { x: 45, y: 90 },
      { x: 72, y: 35 }, { x: 72, y: 65 },
    ],
  },
  {
    id: "3-4-3",
    label: "3-4-3",
    slots: [GK,
      { x: 18, y: 25 }, { x: 18, y: 50 }, { x: 18, y: 75 },
      { x: 45, y: 15 }, { x: 45, y: 38 }, { x: 45, y: 62 }, { x: 45, y: 85 },
      { x: 72, y: 15 }, { x: 72, y: 50 }, { x: 72, y: 85 },
    ],
  },
  {
    id: "5-3-2",
    label: "5-3-2",
    slots: [GK,
      { x: 18, y: 10 }, { x: 18, y: 30 }, { x: 18, y: 50 }, { x: 18, y: 70 }, { x: 18, y: 90 },
      { x: 48, y: 30 }, { x: 48, y: 50 }, { x: 48, y: 70 },
      { x: 75, y: 35 }, { x: 75, y: 65 },
    ],
  },
];

function formationUid() { return `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

/**
 * Construye las 11 piezas de una formación. `side==="opponent"` espeja la X (100-x)
 * para que el rival quede orientado hacia la portería contraria.
 */
export function buildFormationElements(formationId: string, side: "player" | "opponent", color: string): TacticalElement[] {
  const formation = FORMATIONS.find((f) => f.id === formationId);
  if (!formation) return [];
  return formation.slots.map((slot, index) => ({
    id: formationUid(),
    type: side,
    x: side === "opponent" ? 100 - slot.x : slot.x,
    y: slot.y,
    color,
    label: String(index + 1),
  }));
}
