export const COLOR_ENGINE_VERSION = 1;

export const SWATCH_ROLES = [
  "primary",
  "support",
  "accent",
  "neutral",
  "foliage",
] as const;

export const DEFAULT_PROPORTIONS = [40, 25, 15, 15, 5] as const;

export const DEFAULT_SWATCH_NAMES = {
  primary: "Primary",
  support: "Support",
  accent: "Accent",
  neutral: "Neutral",
  foliage: "Foliage",
} as const;

export const NEUTRAL_CHROMA_THRESHOLD = 0.02;
export const FALLBACK_HUE = 30;
export const LIGHTNESS_SHIFTS = [0, 0.05, -0.05] as const;
export const CHROMA_MULTIPLIERS = [1, 0.85, 1.1] as const;
export const MIN_WORKING_CHROMA = 0.08;
export const CHROMA_CLAMP = { min: 0.05, max: 0.18 } as const;
export const MONO_CHROMA_CLAMP = { min: 0, max: 0.18 } as const;
export const SIMILAR_SHADE_DISTANCE = 0.025;
export const FOLIAGE_HUE = 145;
export const COLOR_FIT_DISTANCE_SCALE = 0.25;

export const HEX_HELP = "Enter a HEX color such as #D8A7B1.";
export const NEUTRAL_BASE_WARNING =
  "A warm accent direction was used for this neutral base.";
export const SIMILAR_SHADES_WARNING = "Some shades are very similar.";
export const LOCKED_MODE_WARNING =
  "This harmony mode applies only to regenerated colors.";
export const ALL_LOCKED_EXPLANATION =
  "All colors are locked, so generation and presets cannot change them.";

export const VISUAL_FIT_WEIGHTS = {
  color: 0.6,
  role: 0.2,
  style: 0.1,
  texture: 0.1,
} as const;
