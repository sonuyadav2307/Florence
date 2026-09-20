import { describe, expect, it } from "vitest";
import { normalizeProportions, proportionsAreValid } from "@/lib/color/proportions";

describe("proportions", () => {
  it("PAL 07 rejects totals other than 100", () => {
    expect(proportionsAreValid([40, 25, 15, 15, 22])).toBe(false);
    expect(40 + 25 + 15 + 15 + 22).toBe(117);
    expect(proportionsAreValid([40, 25, 15, 15, 5])).toBe(true);
  });

  it("normalizes with largest remainder and role-order ties", () => {
    expect(normalizeProportions([0, 0, 0, 0, 0])).toEqual([40, 25, 15, 15, 5]);
    const normalized = normalizeProportions([1, 1, 1, 1, 1]);
    expect(normalized.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(normalized).toEqual([20, 20, 20, 20, 20]);
  });
});
