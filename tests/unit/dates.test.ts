import { describe, expect, it } from "vitest";
import { formatEventDate, formatUpdatedAt } from "@/lib/utils";

describe("date formatting", () => {
  it("formats updated timestamps in UTC so server and client match", () => {
    expect(formatUpdatedAt("2026-09-20T12:00:00.000Z")).toBe("Sep 20, 12:00 PM");
  });

  it("formats event dates from calendar days without a local timezone shift", () => {
    expect(formatEventDate("2026-09-20")).toBe("September 20, 2026");
    expect(formatEventDate(null)).toBe("Date not set");
  });
});
