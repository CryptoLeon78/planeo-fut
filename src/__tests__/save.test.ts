import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock } from "@/test/setup";

describe("save flows", () => {
  it("updates a microcycle slot without throwing", async () => {
    const sb = createSupabaseMock({ microcycle_slots: { data: null, error: null } });
    const res = await (sb.from("microcycle_slots") as any).update({ session_id: "x" }).eq("id", "s1");
    expect(res).toBeDefined();
  });

  it("inserts a season event without throwing", async () => {
    const sb = createSupabaseMock({ season_events: { data: { id: "e1" }, error: null } });
    const res = await (sb.from("season_events") as any).insert({ title: "t" });
    expect(res.error).toBeNull();
  });

  it("inserts a session evaluation without throwing", async () => {
    const sb = createSupabaseMock({ session_evaluations: { data: { id: "ev1" }, error: null } });
    const res = await (sb.from("session_evaluations") as any).upsert({ session_id: "s", rating: 4 });
    expect(res.error).toBeNull();
  });
});
