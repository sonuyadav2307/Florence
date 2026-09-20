import { describe, expect, it } from "vitest";
import { generatePalette, allSwatchesLocked } from "@/lib/color/generate";
import { swatchesFromPreset } from "@/data/demo/project";
import type { Swatch } from "@/lib/types";

function garden(): Swatch[] {
  return swatchesFromPreset("garden-romance", (role) => `swatch-${role}`);
}

describe("palette generation", () => {
  it("PAL 03 keeps a locked support hex identical", () => {
    const swatches = garden().map((swatch) =>
      swatch.role === "support" ? { ...swatch, locked: true } : swatch,
    );
    const lockedHex = swatches.find((swatch) => swatch.role === "support")!.hex;
    const result = generatePalette({
      swatches,
      mode: "analogous",
      generationIndex: 0,
    });
    expect(result.swatches.find((swatch) => swatch.role === "support")!.hex).toBe(
      lockedHex,
    );
  });

  it("PAL 04 is deterministic for identical inputs", () => {
    const swatches = garden();
    const first = generatePalette({
      swatches,
      mode: "complementary",
      generationIndex: 2,
    });
    const second = generatePalette({
      swatches,
      mode: "complementary",
      generationIndex: 2,
    });
    expect(first.swatches.map((swatch) => swatch.hex)).toEqual(
      second.swatches.map((swatch) => swatch.hex),
    );
    expect(first.nextGenerationIndex).toBe(second.nextGenerationIndex);
  });

  it("PAL 05 generates from white and black without NaN", () => {
    for (const hex of ["#FFFFFF", "#000000"]) {
      const swatches = garden().map((swatch) =>
        swatch.role === "primary" ? { ...swatch, hex } : swatch,
      );
      const result = generatePalette({
        swatches,
        mode: "analogous",
        generationIndex: 0,
      });
      for (const swatch of result.swatches) {
        expect(swatch.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(swatch.hex).not.toContain("NAN");
      }
      expect(result.warnings).toContain(
        "A warm accent direction was used for this neutral base.",
      );
    }
  });

  it("PAL 06 explains when every swatch is locked", () => {
    const swatches = garden().map((swatch) => ({ ...swatch, locked: true }));
    expect(allSwatchesLocked(swatches)).toBe(true);
    const result = generatePalette({
      swatches,
      mode: "triadic",
      generationIndex: 4,
    });
    expect(result.nextGenerationIndex).toBe(4);
    expect(result.warnings[0]).toMatch(/locked/i);
    expect(result.swatches.map((swatch) => swatch.hex)).toEqual(
      swatches.map((swatch) => swatch.hex),
    );
  });

  it("never changes the primary hex", () => {
    const swatches = garden();
    const result = generatePalette({
      swatches,
      mode: "splitComplementary",
      generationIndex: 1,
    });
    expect(result.swatches.find((swatch) => swatch.role === "primary")!.hex).toBe(
      "#D8A7B1",
    );
  });
});
