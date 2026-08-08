import { describe, expect, it } from "vitest";
import { z } from "zod";
import mcp from "@/lib/mcp/index";

type ToolLike = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  handler: (input: unknown, ctx: unknown) => Promise<{
    isError?: boolean;
    structuredContent?: { ok?: boolean; error?: { code?: string; message?: string; details?: { issues?: unknown[] } } };
    content: Array<{ type: string; text: string }>;
  }>;
};

const tools = (mcp as unknown as { tools: ToolLike[] }).tools;

/** Contract: these tool names are part of the public MCP surface. */
const EXPECTED_TOOLS = [
  "create_exercise",
  "create_microcycle",
  "create_session",
  "delete_record",
  "duplicate_record",
  "list_exercises",
  "list_microcycles",
  "list_sessions",
  "list_versions",
  "restore_deleted_record",
  "restore_version",
  "update_exercise",
  "update_microcycle",
  "update_session",
];

const REQUIRED_ARGS: Record<string, Record<string, unknown>> = {
  create_exercise: { name: "Rondo 4v2" },
  create_microcycle: { name: "MD week", weekStart: "2026-08-10" },
  create_session: { name: "Session 1" },
  delete_record: { entity: "exercise", recordId: crypto.randomUUID() },
  duplicate_record: { entity: "session", recordId: crypto.randomUUID() },
  list_exercises: {},
  list_microcycles: {},
  list_sessions: {},
  list_versions: { entity: "exercise", recordId: crypto.randomUUID() },
  restore_deleted_record: { entity: "exercise", recordId: crypto.randomUUID() },
  restore_version: { entity: "exercise", recordId: crypto.randomUUID(), version: 1 },
  update_exercise: { exerciseId: crypto.randomUUID(), name: "New name" },
  update_microcycle: { microcycleId: crypto.randomUUID(), name: "New name" },
  update_session: { sessionId: crypto.randomUUID(), name: "New name" },
};

const authedCtx = {
  isAuthenticated: () => true,
  getUserId: () => "11111111-1111-4111-8111-111111111111",
  getUserEmail: () => "coach@example.com",
  getToken: () => undefined,
  getClaims: () => ({}),
  getClientId: () => "test-client",
};

const anonCtx = { ...authedCtx, isAuthenticated: () => false, getUserId: () => undefined };

function byName(name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  expect(tool, `tool ${name} is registered`).toBeDefined();
  return tool!;
}

describe("MCP tool contract", () => {
  it("exposes exactly the agreed tool surface", () => {
    expect(tools.map((tool) => tool.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("documents every tool and every argument", () => {
    for (const tool of tools) {
      expect(tool.title, `${tool.name} title`).toBeTruthy();
      expect((tool.description ?? "").length, `${tool.name} description`).toBeGreaterThan(20);
      expect(tool.annotations, `${tool.name} annotations`).toBeDefined();
      for (const [field, schema] of Object.entries(tool.inputSchema ?? {})) {
        expect(schema, `${tool.name}.${field} schema`).toBeInstanceOf(z.ZodType);
        expect((schema as z.ZodTypeAny).description, `${tool.name}.${field} description`).toBeTruthy();
      }
    }
  });

  it("keeps read tools read-only and write tools flagged", () => {
    for (const tool of tools) {
      const readOnly = Boolean(tool.annotations?.["readOnlyHint"]);
      expect(readOnly, `${tool.name} readOnlyHint`).toBe(tool.name.startsWith("list_"));
    }
    expect(byName("delete_record").annotations?.["destructiveHint"]).toBe(true);
  });

  it("rejects unauthenticated calls with a structured error", async () => {
    for (const name of EXPECTED_TOOLS) {
      const result = await byName(name).handler(REQUIRED_ARGS[name] ?? {}, anonCtx);
      expect(result.isError, `${name} isError`).toBe(true);
      expect(result.structuredContent?.ok).toBe(false);
      expect(result.structuredContent?.error?.code).toBe("unauthenticated");
      expect(result.structuredContent?.error?.message).toBeTruthy();
    }
  });

  it("returns code plus issues for invalid or unknown arguments", async () => {
    for (const name of EXPECTED_TOOLS) {
      const result = await byName(name).handler(
        { ...(REQUIRED_ARGS[name] ?? {}), definitelyNotAField: "x" },
        authedCtx,
      );
      expect(result.isError, `${name} isError`).toBe(true);
      const error = result.structuredContent?.error;
      expect(error?.code, `${name} error code`).toBe("invalid_arguments");
      expect(Array.isArray(error?.details?.issues), `${name} issues array`).toBe(true);
      expect((error?.details?.issues ?? []).length).toBeGreaterThan(0);
      expect(result.content[0]?.text.startsWith("invalid_arguments:")).toBe(true);
    }
  });

  it("reports the offending field path for a wrong argument type", async () => {
    const result = await byName("list_exercises").handler({ limit: "many" }, authedCtx);
    const issues = (result.structuredContent?.error?.details?.issues ?? []) as Array<{ path: string; code: string }>;
    expect(result.structuredContent?.error?.code).toBe("invalid_arguments");
    expect(issues.some((issue) => issue.path === "limit")).toBe(true);
  });
});
