import { describe, it, expect } from "vitest";
import { createConfiguredQueryClient, paginateArray, queryKeys } from "@/lib/query-config";

describe("Query Optimization & Caching Config", () => {
  it("creates queryClient with optimized staleTime and gcTime", () => {
    const client = createConfiguredQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 3);
    expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 15);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  it("provides consistent query keys across domain entities", () => {
    expect(queryKeys.teams("u-123")).toEqual(["teams", "u-123"]);
    expect(queryKeys.exercise("ex-456")).toEqual(["exercise", "ex-456"]);
    expect(queryKeys.microcycleSlots("mc-789")).toEqual(["microcycle-slots", "mc-789"]);
  });

  it("paginates dataset correctly with metadata", () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
    const page1 = paginateArray(items, 1, 10);
    expect(page1.data.length).toBe(10);
    expect(page1.total).toBe(45);
    expect(page1.totalPages).toBe(5);
    expect(page1.hasNext).toBe(true);
    expect(page1.hasPrev).toBe(false);
    expect(page1.data[0].id).toBe(1);

    const page5 = paginateArray(items, 5, 10);
    expect(page5.data.length).toBe(5);
    expect(page5.hasNext).toBe(false);
    expect(page5.hasPrev).toBe(true);
  });
});
