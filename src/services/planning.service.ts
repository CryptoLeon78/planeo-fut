import {
  mesocyclesRepository,
  seasonEventsRepository,
  type MesocycleRow,
  type MesocycleType,
} from "@/api/mesocycles.repository";
import { PRESEASON_PHASES } from "@/lib/constants";

export type MesocycleInput = {
  ownerId: string;
  name: string;
  startDate: string;
  endDate: string;
  goals?: string | null;
};

/** Default preseason phase structure (conditioning → technical → competitive). */
export function defaultPreseasonPhases() {
  return PRESEASON_PHASES.map((p) => ({ key: p.key, label: p.label, weeks: p.duration, focus: "" }));
}

export function validateMesocycleInput(input: MesocycleInput): string | null {
  if (!input.name.trim()) return "El nombre es obligatorio";
  if (!input.startDate || !input.endDate) return "Las fechas son obligatorias";
  if (input.endDate < input.startDate) return "La fecha de fin debe ser posterior al inicio";
  return null;
}

export const planningService = {
  list: (type: MesocycleType) => mesocyclesRepository.listByType(type),
  getById: (id: string) => mesocyclesRepository.getById(id),
  update: (id: string, patch: MesocycleRow) => mesocyclesRepository.update(id, patch),
  remove: (id: string) => mesocyclesRepository.remove(id),

  async create(type: MesocycleType, input: MesocycleInput): Promise<MesocycleRow> {
    return mesocyclesRepository.create({
      owner_id: input.ownerId,
      type,
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      goals: input.goals || null,
      phases: type === "pretemporada" ? defaultPreseasonPhases() : [],
    });
  },

  events: {
    list: (mesocycleId: string) => seasonEventsRepository.listByMesocycle(mesocycleId),
    create: (payload: MesocycleRow) => seasonEventsRepository.create(payload),
    remove: (id: string) => seasonEventsRepository.remove(id),
  },
};
