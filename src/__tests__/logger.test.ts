import { describe, it, expect, beforeEach } from "vitest";
import { logger } from "@/lib/logger";

describe("Structured Logging & Performance Monitoring", () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it("records info and error logs into in-memory buffer", () => {
    logger.info("Test info message", { meta: "value" });
    logger.error("Test error message", { code: 500 });

    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe("info");
    expect(logs[0].message).toBe("Test info message");
    expect(logs[1].level).toBe("error");
  });

  it("redacts sensitive fields like passwords and tokens", () => {
    logger.info("Auth attempt", { password: "secretPassword123", token: "bearer-xyz", email: "coach@fc.com" });
    const log = logger.getRecentLogs()[0];
    expect(log.context?.password).toBe("[REDACTED]");
    expect(log.context?.token).toBe("[REDACTED]");
    expect(log.context?.email).toBe("coach@fc.com");
  });

  it("measures performance timing for sync and async actions", async () => {
    const result = await logger.measure("async-calculation", async () => {
      return 42 * 2;
    });

    expect(result).toBe(84);
    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].message).toContain("Performance: async-calculation");
    expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
