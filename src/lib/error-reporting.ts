type ErrorContext = Record<string, unknown>;

/** Small runtime-neutral error boundary hook. Cloudflare captures server logs. */
export function reportError(error: unknown, context: ErrorContext = {}) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  console.error("[PlaneoFUT] application error", {
    name: normalized.name,
    message: normalized.message,
    ...context,
  });
}
