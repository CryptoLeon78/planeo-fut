import { logger } from "./logger";

type ErrorContext = Record<string, unknown>;

/** Standard runtime-neutral error boundary hook with structured telemetry logging. */
export function reportError(error: unknown, context: ErrorContext = {}) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  logger.error(normalized.message, {
    name: normalized.name,
    stack: normalized.stack,
    ...context,
  });
}
