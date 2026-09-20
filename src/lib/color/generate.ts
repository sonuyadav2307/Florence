import type { Harmony, Swatch } from "@/lib/types";
import {
  ALL_LOCKED_EXPLANATION,
  CHROMA_CLAMP,
  CHROMA_MULTIPLIERS,
  FALLBACK_HUE,
  FOLIAGE_HUE,
  LIGHTNESS_SHIFTS,
  LOCKED_MODE_WARNING,
  MIN_WORKING_CHROMA,
  MONO_CHROMA_CLAMP,
  NEUTRAL_BASE_WARNING,
  NEUTRAL_CHROMA_THRESHOLD,
  SIMILAR_SHADE_DISTANCE,
  SIMILAR_SHADES_WARNING,
} from "./constants";
import { hexToOklch, hexDistanceOkLab, oklchToHex } from "./culori-bridge";
import { clamp, wrapHue } from "./math";

export interface GenerationInput {
  swatches: Swatch[];
  mode: Harmony;
  generationIndex: number;
}

export interface GenerationResult {
  swatches: Swatch[];
  warnings: string[];
  nextGenerationIndex: number;
}

interface HarmonySlots {
  supportHue: number;
  accentHue: number;
  supportLightness: (L: number, shift: number) => number;
  accentLightness: (L: number, shift: number) => number;
}

const HARMONY: Record<Harmony, HarmonySlots> = {
  analogous: {
    supportHue: -30,
    accentHue: 30,
    supportLightness: (L, shift) => clamp(L + 0.12 + shift, 0.35, 0.9),
    accentLightness: (L, shift) => clamp(L - 0.12 + shift, 0.3, 0.85),
  },
  complementary: {
    supportHue: 0,
    accentHue: 180,
    supportLightness: (L, shift) => clamp(L + 0.18 + shift, 0.35, 0.9),
    accentLightness: (L, shift) => clamp(L - 0.05 + shift, 0.3, 0.85),
  },
  splitComplementary: {
    supportHue: 150,
    accentHue: 210,
    supportLightness: (L, shift) => clamp(L + 0.1 + shift, 0.35, 0.9),
    accentLightness: (L, shift) => clamp(L - 0.08 + shift, 0.3, 0.85),
  },
  triadic: {
    supportHue: 120,
    accentHue: 240,
    supportLightness: (L, shift) => clamp(L + 0.1 + shift, 0.35, 0.9),
    accentLightness: (L, shift) => clamp(L - 0.08 + shift, 0.3, 0.85),
  },
  monochromatic: {
    supportHue: 0,
    accentHue: 0,
    supportLightness: (L, shift) => clamp(L + 0.2 + shift, 0.35, 0.92),
    accentLightness: (L, shift) => clamp(L - 0.2 + shift, 0.25, 0.85),
  },
};

function byRole(swatches: Swatch[], role: Swatch["role"]): Swatch {
  const found = swatches.find((swatch) => swatch.role === role);
  if (!found) {
    throw new Error(`Missing ${role} swatch`);
  }
  return found;
}

export function allSwatchesLocked(swatches: Swatch[]): boolean {
  return swatches.every((swatch) => swatch.locked);
}

export function generatePalette(input: GenerationInput): GenerationResult {
  const { swatches, mode, generationIndex } = input;
  const warnings: string[] = [];
  if (allSwatchesLocked(swatches)) {
    return {
      swatches: swatches.map((swatch) => ({ ...swatch })),
      warnings: [ALL_LOCKED_EXPLANATION],
      nextGenerationIndex: generationIndex,
    };
  }

  const primary = byRole(swatches, "primary");
  const primaryOklch = hexToOklch(primary.hex);
  let hue = primaryOklch.h;
  const chroma = primaryOklch.c;
  const lightness = primaryOklch.l;
  if (hue === undefined || chroma < NEUTRAL_CHROMA_THRESHOLD) {
    hue = FALLBACK_HUE;
    warnings.push(NEUTRAL_BASE_WARNING);
  }
  hue = wrapHue(hue);

  const k = ((generationIndex % 3) + 3) % 3;
  const shift = LIGHTNESS_SHIFTS[k];
  const multiplier = CHROMA_MULTIPLIERS[k];
  const workingChroma = clamp(
    Math.max(chroma, MIN_WORKING_CHROMA) * multiplier,
    CHROMA_CLAMP.min,
    CHROMA_CLAMP.max,
  );
  const monoChroma = clamp(chroma, MONO_CHROMA_CLAMP.min, MONO_CHROMA_CLAMP.max);
  const accentChroma = mode === "monochromatic" ? monoChroma : workingChroma;
  const supportChroma =
    mode === "monochromatic" ? monoChroma : workingChroma * 0.7;
  const recipe = HARMONY[mode];

  const generated: Record<"support" | "accent" | "neutral" | "foliage", string> =
    {
      support: oklchToHex(
        recipe.supportLightness(lightness, shift),
        supportChroma,
        wrapHue(hue + recipe.supportHue),
      ),
      accent: oklchToHex(
        recipe.accentLightness(lightness, shift),
        accentChroma,
        wrapHue(hue + recipe.accentHue),
      ),
      neutral: oklchToHex(0.95, 0.012, hue),
      foliage: oklchToHex(0.52 + shift, 0.07, FOLIAGE_HUE),
    };

  const next = swatches.map((swatch) => {
    if (swatch.role === "primary" || swatch.locked) {
      return { ...swatch, hex: swatch.hex };
    }
    if (
      swatch.role === "support" ||
      swatch.role === "accent" ||
      swatch.role === "neutral" ||
      swatch.role === "foliage"
    ) {
      return { ...swatch, hex: generated[swatch.role] };
    }
    return { ...swatch };
  });

  const lockedBlocking =
    byRole(swatches, "support").locked || byRole(swatches, "accent").locked;
  if (lockedBlocking) {
    warnings.push(LOCKED_MODE_WARNING);
  }

  for (let i = 0; i < next.length; i += 1) {
    for (let j = i + 1; j < next.length; j += 1) {
      if (hexDistanceOkLab(next[i].hex, next[j].hex) < SIMILAR_SHADE_DISTANCE) {
        warnings.push(SIMILAR_SHADES_WARNING);
        i = next.length;
        break;
      }
    }
  }

  return {
    swatches: next,
    warnings: Array.from(new Set(warnings)),
    nextGenerationIndex: generationIndex + 1,
  };
}

export function applyPresetToSwatches(
  current: Swatch[],
  presetSwatches: Array<{ role: Swatch["role"]; name: string; hex: string }>,
): { swatches: Swatch[]; unchangedLocked: number } {
  let unchangedLocked = 0;
  const next = current.map((swatch) => {
    const incoming = presetSwatches.find((item) => item.role === swatch.role);
    if (!incoming) {
      return { ...swatch };
    }
    if (swatch.locked) {
      unchangedLocked += 1;
      return { ...swatch };
    }
    return {
      ...swatch,
      name: incoming.name,
      hex: incoming.hex,
    };
  });
  return { swatches: next, unchangedLocked };
}
