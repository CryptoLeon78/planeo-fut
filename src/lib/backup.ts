/**
 * Pure helpers for the backup / export / import feature.
 * Client-safe: no database access here.
 */

export const BACKUP_ENTITIES = [
  "exercises",
  "sessions",
  "microcycles",
  "mesocycles",
  "season_events",
  "session_evaluations",
] as const;

export type BackupEntity = (typeof BACKUP_ENTITIES)[number];

export const ENTITY_LABELS: Record<BackupEntity, string> = {
  exercises: "Ejercicios",
  sessions: "Sesiones (con bloques)",
  microcycles: "Microciclos (con slots)",
  mesocycles: "Mesociclos (pretemporada / temporada)",
  season_events: "Eventos de temporada",
  session_evaluations: "Evaluaciones de sesión",
};

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type BackupRow = Record<string, JsonValue>;

export type BackupPayload = {
  version: 1;
  generated_at: string;
  entities: Partial<Record<BackupEntity, BackupRow[]>>;
};

/** Serialises a list of flat rows to CSV (RFC 4180 quoting). */
export function toCsv(rows: BackupRow[]): string {
  if (rows.length === 0) return "";
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  const lines = [columns.join(",")];
  for (const row of rows) lines.push(columns.map((c) => escape(row[c])).join(","));
  return lines.join("\r\n");
}

export function backupFileName(format: "json" | "csv", entity?: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `planeofut-${entity ? `${entity}-` : ""}${stamp}.${format}`;
}

/** Fields that must never be carried over when importing rows from another account. */
const NON_PORTABLE = ["id", "owner_id", "created_at", "updated_at", "deleted_at", "team_id"];

export function sanitiseImportRow(row: BackupRow): BackupRow {
  const copy: BackupRow = { ...row };
  for (const field of NON_PORTABLE) delete copy[field];
  return copy;
}

export function parseBackupFile(text: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  if (!parsed || typeof parsed !== "object" || !("entities" in parsed)) {
    throw new Error("El archivo no tiene el formato de copia de PlaneoFUT.");
  }
  return parsed as BackupPayload;
}
