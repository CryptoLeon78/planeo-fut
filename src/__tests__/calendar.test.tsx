import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { createSupabaseMock } from "@/test/setup";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createSupabaseMock({
    sessions: { data: [], error: null },
    season_events: { data: [], error: null },
    microcycle_slots: { data: [], error: null },
  }),
}));

describe("calendar route", () => {
  it("renders weekly calendar with 7 day cards", async () => {
    const mod = await import("@/routes/_authenticated/calendar");
    const Cmp = (mod.Route as any).component;
    renderWithProviders(<Cmp />);
    expect(await screen.findByText("Calendario semanal")).toBeInTheDocument();
    expect(screen.getAllByText(/libre/i).length).toBeGreaterThanOrEqual(7);
  });
});
