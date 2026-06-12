import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { createSupabaseMock } from "@/test/setup";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createSupabaseMock({
    microcycles: { data: [{ id: "m1", name: "Mc 1", week_start: "2026-06-15", match_day: "sabado", weekly_objective: "obj" }], error: null },
    "microcycles.single": { data: { id: "m1", name: "Mc 1", week_start: "2026-06-15", match_day: "sabado", weekly_objective: "obj", notes: "n" }, error: null },
    microcycle_slots: { data: [
      { id: "s1", slot_type: "MD-4", slot_date: "2026-06-16", session_id: null, notes: null },
      { id: "s2", slot_type: "MD-3", slot_date: "2026-06-17", session_id: null, notes: null },
      { id: "s3", slot_type: "MD-2", slot_date: "2026-06-18", session_id: null, notes: null },
      { id: "s4", slot_type: "MD-1", slot_date: "2026-06-19", session_id: null, notes: null },
      { id: "s5", slot_type: "MD", slot_date: "2026-06-20", session_id: null, notes: null },
    ], error: null },
    sessions: { data: [], error: null },
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe("microcycles routes", () => {
  it("renders microcycles index list", async () => {
    const mod = await import("@/routes/_authenticated/microcycles.index");
    const Cmp = (mod.Route as any).component;
    renderWithProviders(<Cmp />);
    expect(await screen.findByText("Microciclos")).toBeInTheDocument();
    expect(await screen.findByText(/Mc 1/)).toBeInTheDocument();
  });

  it("renders microcycle detail with 5 slots", async () => {
    const mod = await import("@/routes/_authenticated/microcycles.$id");
    const Cmp = (mod.Route as any).component;
    renderWithProviders(<Cmp />);
    expect(await screen.findByText("Mc 1")).toBeInTheDocument();
    expect(await screen.findByText("MD-4")).toBeInTheDocument();
    expect(await screen.findByText("MD")).toBeInTheDocument();
  });
});
