import { createFileRoute } from "@tanstack/react-router";
import { getEffectiveSecurityConfig } from "@/lib/security-headers";

function isAuthorized(request: Request): boolean {
  const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  const supplied = request.headers.get("apikey");
  return Boolean(expected && supplied && supplied === expected);
}

export const Route = createFileRoute("/api/public/security/csp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json(getEffectiveSecurityConfig(), {
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});