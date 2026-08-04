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

export const MICROCYCLE_SLOT_TYPES = [
  { value: "MD-4", label: "MD-4 · Recuperación / activación", intensity: "baja" },
  { value: "MD-3", label: "MD-3 · Fuerza / duelos", intensity: "alta" },
  { value: "MD-2", label: "MD-2 · Táctico / resistencia", intensity: "media" },
  { value: "MD-1", label: "MD-1 · Activación pre-partido", intensity: "baja" },
  { value: "MD", label: "MD · Partido", intensity: "muy_alta" },
] as const;

export const SEASON_EVENT_TYPES = [
  { value: "partido_oficial", label: "Partido oficial" },
  { value: "amistoso", label: "Amistoso" },
  { value: "test_fisico", label: "Test físico" },
  { value: "descanso", label: "Descanso" },
  { value: "evento", label: "Evento" },
  { value: "reunion", label: "Reunión" },
] as const;

export const MESOCYCLE_TYPES = [
  { value: "pretemporada", label: "Pretemporada" },
  { value: "temporada", label: "Temporada competitiva" },
] as const;

export const PRESEASON_PHASES = [
  { key: "acondicionamiento", label: "Acondicionamiento físico", duration: 2 },
  { key: "tecnico_tactico", label: "Técnico-táctico", duration: 2 },
  { key: "competitivo", label: "Competitivo / amistosos", duration: 2 },
] as const;

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const locale = typeof document !== "undefined" && document.documentElement.lang === "en-GB" ? "en-GB" : "es-ES";
  return date.toLocaleDateString(locale, opts ?? { day: "numeric", month: "short" });
}
