import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { createSupabaseMock } from "@/test/setup";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createSupabaseMock({
    mesocycles: { data: [{ id: "p1", name: "Pre 2026", start_date: "2026-07-01", end_date: "2026-08-15", goals: "g", phases: [{ key: "acondicionamiento", label: "Acond", weeks: 2, focus: "" }] }], error: null },
  }),
}));

describe("preseason routes", () => {
  it("renders preseason index", async () => {
    const mod = await import("@/routes/_authenticated/preseason.index");
    const Cmp = (mod.Route as any).component;
    renderWithProviders(<Cmp />);
    expect(await screen.findByText("Pretemporada")).toBeInTheDocument();
    expect(await screen.findByText(/Pre 2026/)).toBeInTheDocument();
  });
});
