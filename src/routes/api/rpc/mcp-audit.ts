import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
  tool: z.string().trim().min(1).max(60).regex(/^[a-z0-9_]+$/i).optional(),
  status: z.enum(["success", "error"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  includeParams: z
    .union([z.literal("true"), z.literal("false")])
    .default("false")
    .transform((value) => value === "true"),
});

/**
 * Returns the signed-in coach's own agent (MCP) activity log with pagination,
 * tool/status/date filters. Tool parameters stay hidden unless explicitly requested,
 * and they were already sanitised (credentials redacted) before being stored.
 */
async function readAudit(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return Response.json({ error: "backend_not_configured" }, { status: 500 });

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_arguments",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join(".") || "(root)",
          code: issue.code,
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }
  const { limit, offset, tool, status, from, to, includeParams } = parsed.data;
  if (from && to && from > to) {
    return Response.json({ error: "invalid_arguments", issues: [{ path: "from", code: "custom", message: "from must be earlier than or equal to to." }] }, { status: 400 });
  }

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const columns = includeParams
    ? "id,tool,status,error_code,error_message,duration_ms,params,created_at"
    : "id,tool,status,error_code,error_message,duration_ms,created_at";

  let query = supabase
    .from("mcp_audit_log")
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tool) query = query.eq("tool", tool);
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const { data, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const items = data ?? [];
  const total = count ?? items.length;
  return Response.json({
    items,
    count: items.length,
    total,
    limit,
    offset,
    nextOffset: offset + items.length < total ? offset + items.length : null,
    filters: { tool: tool ?? null, status: status ?? null, from: from ?? null, to: to ?? null },
    paramsIncluded: includeParams,
  });
}

export const Route = createFileRoute("/api/rpc/mcp-audit")({
  server: {
    handlers: {
      GET: async ({ request }) => readAudit(request),
      POST: async ({ request }) => readAudit(request),
    },
  },
});
