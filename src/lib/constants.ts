export const TEAM_CATEGORIES = [
  { value: "futbol_base", label: "Fútbol base" },
  { value: "amateur", label: "Amateur" },
  { value: "cantera", label: "Cantera" },
  { value: "alto_rendimiento", label: "Alto rendimiento" },
  { value: "elite", label: "Élite" },
] as const;

export const INTENSITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "muy_alta", label: "Muy alta" },
] as const;

export const GAME_PHASES = [
  { value: "inicio", label: "Inicio" },
  { value: "progresion", label: "Progresión" },
  { value: "finalizacion", label: "Finalización" },
  { value: "transicion_ad", label: "Transición Ataque-Defensa" },
  { value: "transicion_da", label: "Transición Defensa-Ataque" },
  { value: "abp", label: "ABP" },
  { value: "general", label: "General" },
] as const;

export const TASK_TYPES = [
  { value: "analitica", label: "Analítica" },
  { value: "global", label: "Global" },
  { value: "integrada", label: "Integrada" },
  { value: "situacional", label: "Situacional" },
  { value: "competitiva", label: "Competitiva" },
  { value: "rondo", label: "Rondo" },
  { value: "juego_reducido", label: "Juego reducido" },
  { value: "partido", label: "Partido" },
] as const;

export const BLOCK_TYPES = [
  { value: "calentamiento", label: "Calentamiento" },
  { value: "parte_principal", label: "Parte principal" },
  { value: "juego_aplicacion", label: "Juego de aplicación" },
  { value: "vuelta_calma", label: "Vuelta a la calma" },
] as const;

export const COMMON_TAGS = [
  "posesión", "presión alta", "salida de balón", "ataque posicional",
  "transiciones", "ABP", "finalización", "centros", "1v1", "duelo aéreo",
  "vigilancias", "repliegue", "marcaje", "contraataque",
];

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}
