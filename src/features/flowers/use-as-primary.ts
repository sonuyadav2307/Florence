import { generatePalette } from "@/lib/color";
import type { Harmony, Swatch } from "@/lib/types";

export function applyPrimaryDialog(
  swatches: Swatch[],
  hex: string,
  mode: Harmony,
  unlockPrimary: boolean,
) {
  const prepared = swatches.map((swatch) => {
    if (swatch.role !== "primary") return swatch;
    return { ...swatch, locked: unlockPrimary ? false : swatch.locked, hex };
  });
  if (prepared.find((swatch) => swatch.role === "primary")?.locked) {
    return { swatches };
  }
  return generatePalette({
    swatches: prepared,
    mode,
    generationIndex: 0,
  });
}
