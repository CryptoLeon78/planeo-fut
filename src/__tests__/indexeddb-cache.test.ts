import { describe, it, expect } from "vitest";
import { resolveConflict } from "@/lib/indexeddb-cache";

describe("Smart IndexedDB Cache & Conflict Resolution", () => {
  it("resolves conflicts using version numbers when available", () => {
    const localEntity = { id: "item-1", name: "Version 2 Local", version: 2, updated_at: "2026-08-01T10:00:00Z" };
    const serverEntity = { id: "item-1", name: "Version 3 Server", version: 3, updated_at: "2026-08-01T09:00:00Z" };

    const { resolved, winner } = resolveConflict(localEntity, serverEntity);
    expect(winner).toBe("server");
    expect(resolved.version).toBe(3);
    expect(resolved.name).toBe("Version 3 Server");
  });

  it("resolves conflicts using ISO timestamps when version numbers are absent", () => {
    const localEntity = { id: "ex-10", name: "Rondo Local Newer", updated_at: "2026-09-03T12:00:00Z" };
    const serverEntity = { id: "ex-10", name: "Rondo Server Older", updated_at: "2026-09-03T10:00:00Z" };

    const { resolved, winner } = resolveConflict(localEntity, serverEntity);
    expect(winner).toBe("local");
    expect(resolved.name).toBe("Rondo Local Newer");
  });

  it("favors server entity when timestamps match exactly", () => {
    const localEntity = { id: "s-1", name: "Session A", updated_at: "2026-09-01T10:00:00Z" };
    const serverEntity = { id: "s-1", name: "Session B", updated_at: "2026-09-01T10:00:00Z" };

    const { winner } = resolveConflict(localEntity, serverEntity);
    expect(winner).toBe("server");
  });
});
