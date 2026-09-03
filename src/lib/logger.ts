export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  durationMs?: number;
}

const MAX_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

// Fields to redact for security and privacy
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 4 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      clean[k] = "[REDACTED]";
    } else {
      clean[k] = sanitize(v, depth + 1);
    }
  }
  return clean;
}

function recordLog(level: LogLevel, message: string, context?: Record<string, unknown>, durationMs?: number) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
    durationMs,
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  const prefix = `[PlaneoFUT][${level.toUpperCase()}]`;
  const details = entry.context ? JSON.stringify(entry.context) : "";
  const duration = durationMs != null ? `(${durationMs.toFixed(1)}ms)` : "";

  switch (level) {
    case "error":
      console.error(prefix, message, duration, details);
      break;
    case "warn":
      console.warn(prefix, message, duration, details);
      break;
    case "info":
      console.info(prefix, message, duration, details);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(prefix, message, duration, details);
      }
      break;
  }

  return entry;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    return recordLog("debug", message, context);
  },

  info(message: string, context?: Record<string, unknown>) {
    return recordLog("info", message, context);
  },

  warn(message: string, context?: Record<string, unknown>) {
    return recordLog("warn", message, context);
  },

  error(message: string, context?: Record<string, unknown>) {
    return recordLog("error", message, context);
  },

  /**
   * Start a performance measurement timer
   */
  startTimer(label: string): () => number {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    return () => {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const duration = end - start;
      recordLog("info", `Performance: ${label}`, undefined, duration);
      return duration;
    };
  },

  /**
   * Measures the execution time of a synchronous or asynchronous function
   */
  async measure<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const stop = logger.startTimer(label);
    try {
      const result = await fn();
      stop();
      return result;
    } catch (err) {
      stop();
      logger.error(`Error during measured operation: ${label}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },

  /**
   * Returns recent in-memory telemetry logs
   */
  getRecentLogs(): readonly LogEntry[] {
    return [...logBuffer];
  },

  /**
   * Clears in-memory buffer
   */
  clearLogs() {
    logBuffer.length = 0;
  },
};
