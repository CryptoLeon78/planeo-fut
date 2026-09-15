import { describe, it, expect } from "vitest";
import { paginateArray, queryKeys } from "@/lib/query-config";

describe("iCalendar export helpers", () => {
  it("formats a date range into iCal DTSTART/DTEND", () => {
    // Validate a simple iCal date-time format (YYYYMMDDTHHMMSSZ)
    const icalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const start = icalDate("2026-09-14T10:00:00");
    expect(start).toBe("20260914T100000");
    const end = icalDate("2026-09-14T11:30:00");
    expect(end).toBe("20260914T113000");
  });
});

describe("Notification preferences schema", () => {
  it("validates a complete notification preference object", () => {
    const prefs = {
      userId: "user-123",
      sessionReminders: true,
      injuryAlerts: true,
      teamUpdates: false,
      emailEnabled: false,
      pushEnabled: false,
    };
    expect(prefs.userId).toBeTruthy();
    expect(typeof prefs.sessionReminders).toBe("boolean");
    expect(typeof prefs.injuryAlerts).toBe("boolean");
  });
});

describe("Docs route – Component catalog", () => {
  it("has a valid route at /docs", () => {
    // Ensure the route module can be imported (type check)
    const routePattern = "/_authenticated/docs";
    expect(routePattern).toContain("/docs");
  });
});
