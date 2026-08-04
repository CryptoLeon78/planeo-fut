import { createFileRoute } from "@tanstack/react-router";

/** Stable RPC-shaped probe used by deployment smoke checks. */
export const Route = createFileRoute("/api/rpc/security-probe")({
  server: {
    handlers: {
      POST: async () => Response.json({ status: "ok", transport: "rpc" }),
    },
  },
});