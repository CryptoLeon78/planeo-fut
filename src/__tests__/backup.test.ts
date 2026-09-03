import { describe, expect, it } from "vitest";
import { BACKUP_ENTITIES, backupFileName, parseBackupFile, sanitiseImportRow, toCsv } from "@/lib/backup";

describe("backup helpers", () => {
  it("exposes the exportable entities", () => {
    expect(BACKUP_ENTITIES).toContain("exercises");
    expect(BACKUP_ENTITIES).toContain("microcycles");
  });

  it("serialises rows to CSV with RFC4180 quoting", () => {
    const csv = toCsv([
      { name: "Rondo 4v2", objective: 'Presión, "alta"' },
      { name: "Salida de balón", objective: null },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("name,objective");
    expect(lines[1]).toBe('Rondo 4v2,"Presión, ""alta"""');
    expect(lines[2]).toBe("Salida de balón,");
  });

  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("builds file names with entity and extension", () => {
    expect(backupFileName("json")).toMatch(/^planeofut-.*\.json$/);
    expect(backupFileName("csv", "exercises")).toMatch(/^planeofut-exercises-.*\.csv$/);
  });

  it("strips non portable fields on import", () => {
    const clean = sanitiseImportRow({
      id: "1",
      owner_id: "u",
      created_at: "x",
      updated_at: "x",
      deleted_at: null,
      team_id: "t",
      name: "Rondo",
    });
    expect(clean).toEqual({ name: "Rondo" });
  });

  it("parses a valid backup file and rejects invalid input", () => {
    const payload = parseBackupFile(JSON.stringify({ version: 1, entities: { exercises: [] } }));
    expect(payload.entities.exercises).toEqual([]);
    expect(() => parseBackupFile("not json")).toThrow();
    expect(() => parseBackupFile(JSON.stringify({ foo: 1 }))).toThrow();
  });
});
