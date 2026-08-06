import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z, type ZodRawShape } from "zod";
import { supabaseForUser } from "./supabase";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type ErrorCode =
  | "unauthenticated"
  | "invalid_arguments"
  | "not_found"
  | "conflict"
  | "backend_error"
  | "unexpected_error";

/** Structured, machine-readable error payload returned to the calling agent. */
export function toolError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ToolResult {
  const error = { code, message, ...(details ? { details } : {}) };
  return {
    content: [{ type: "text", text: `${code}: ${message}` }],
    structuredContent: { ok: false, error },
    isError: true,
  };
}

export function toolSuccess(text: string, data: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text }], structuredContent: { ok: true, ...data } };
}

const SENSITIVE = /(token|password|secret|authorization|apikey|api_key|email)/i;
const MAX_STRING = 240;

/** Removes credentials and truncates long values before anything is persisted. */
export function sanitiseParams(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitiseParams(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE.test(key) ? "[redacted]" : sanitiseParams(item, depth + 1);
    }
    return out;
  }
  return "[unsupported]";
}

async function recordAudit(
  ctx: ToolContext,
  entry: {
    tool: string;
    params: unknown;
    status: "success" | "error";
    errorCode?: string;
    errorMessage?: string;
    durationMs: number;
  },
) {
  const userId = ctx.getUserId();
  if (!userId) return;
  try {
    await supabaseForUser(ctx).from("mcp_audit_log").insert({
      user_id: userId,
      tool: entry.tool,
      params: sanitiseParams(entry.params) as never,
      status: entry.status,
      error_code: entry.errorCode ?? null,
      error_message: entry.errorMessage ? entry.errorMessage.slice(0, 500) : null,
      duration_ms: entry.durationMs,
    });
  } catch {
    // Auditing must never break a tool call.
  }
}

type Annotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

/**
 * Wraps a tool with strict schema validation, authentication checks,
 * structured error results and audit logging.
 */
export function defineAuthedTool<Shape extends ZodRawShape>(config: {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  annotations?: Annotations;
  handler: (
    input: z.infer<z.ZodObject<Shape>>,
    ctx: ToolContext,
    userId: string,
  ) => Promise<ToolResult>;
}) {
  const strictSchema = z.object(config.inputSchema).strict();

  return defineTool({
    name: config.name,
    title: config.title,
    description: config.description,
    inputSchema: config.inputSchema,
    annotations: config.annotations,
    handler: async (rawInput: unknown, ctx: ToolContext) => {
      const started = Date.now();
      const finish = async (result: ToolResult) => {
        const error = (result.structuredContent as { error?: { code?: string; message?: string } } | undefined)?.error;
        await recordAudit(ctx, {
          tool: config.name,
          params: rawInput,
          status: result.isError ? "error" : "success",
          errorCode: error?.code,
          errorMessage: error?.message,
          durationMs: Date.now() - started,
        });
        return result;
      };

      if (!ctx.isAuthenticated()) {
        return finish(toolError("unauthenticated", "Sign in to PlaneoFUT before calling this tool."));
      }
      const userId = ctx.getUserId();
      if (!userId) {
        return finish(toolError("unauthenticated", "The authenticated session has no user identifier."));
      }

      const parsed = strictSchema.safeParse(rawInput ?? {});
      if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => ({
          path: issue.path.join(".") || "(root)",
          code: issue.code,
          message: issue.message,
        }));
        return finish(
          toolError("invalid_arguments", "One or more arguments are missing or invalid.", { issues }),
        );
      }

      try {
        return await finish(await config.handler(parsed.data, ctx, userId));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return finish(toolError("unexpected_error", message));
      }
    },
  });
}
