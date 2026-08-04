import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_serverFn/security-probe")({
  server: {
    handlers: {
      POST: async () => Response.json({ status: "ok", transport: "rpc" }),
    },
  },
});