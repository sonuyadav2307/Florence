import { describe, expect, it } from "vitest";
import { createGardenDinnerProject, createDefaultPayload } from "@/data/demo/project";
import { projectPayloadSchema } from "@/lib/validation/project";
import { FLOWER_CATALOG } from "@/data/demo/catalog";
import { PALETTE_PRESETS } from "@/data/demo/presets";

describe("fixtures and payload contract", () => {
  it("accepts Garden Dinner and a new event payload", () => {
    expect(projectPayloadSchema.parse(createGardenDinnerProject().payload).schemaVersion).toBe(1);
    expect(projectPayloadSchema.parse(createDefaultPayload()).selectedFlowers).toEqual([]);
  });

  it("ships 16 catalog variants and three presets", () => {
    expect(FLOWER_CATALOG).toHaveLength(16);
    expect(PALETTE_PRESETS).toHaveLength(3);
    expect(PALETTE_PRESETS[0].swatches.map((swatch) => swatch.hex)).toEqual([
      "#D8A7B1",
      "#E8C7B8",
      "#8B4D65",
      "#F4EFE7",
      "#71816A",
    ]);
  });

  it("rejects unknown payload fields", () => {
    const payload = createDefaultPayload() as unknown as Record<string, unknown>;
    payload.secret = "nope";
    expect(projectPayloadSchema.safeParse(payload).success).toBe(false);
  });
});
