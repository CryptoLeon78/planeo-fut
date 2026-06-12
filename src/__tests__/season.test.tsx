import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { createSupabaseMock } from "@/test/setup";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createSupabaseMock({
    mesocycles: { data: [{ id: "t1", name: "Temp 2026-2027", start_date: "2026-08-15", end_date: "2027-06-30", goals: "g" }], error: null },
  }),
}));

describe("season routes", () => {
  it("renders season list", async () => {
    const mod = await import("@/routes/_authenticated/season.index");
    const Cmp = (mod.Route as any).component;
    renderWithProviders(<Cmp />);
    expect(await screen.findByText("Temporada")).toBeInTheDocument();
    expect(await screen.findByText(/Temp 2026-2027/)).toBeInTheDocument();
  });
});
