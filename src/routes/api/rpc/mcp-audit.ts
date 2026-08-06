import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Returns the signed-in coach's own agent (MCP) activity log.
 * Requires an Authorization bearer token; rows are filtered by RLS.
 */
async function readAudit(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return Response.json({ error: "backend_not_configured" }, { status: 500 });

  const requestUrl = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(requestUrl.searchParams.get("limit") ?? 50) || 50));

  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("mcp_audit_log")
    .select("id,tool,status,error_code,error_message,duration_ms,params,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ items: data ?? [], count: data?.length ?? 0 });
}

export const Route = createFileRoute("/api/rpc/mcp-audit")({
  server: {
    handlers: {
      GET: async ({ request }) => readAudit(request),
      POST: async ({ request }) => readAudit(request),
    },
  },
});
