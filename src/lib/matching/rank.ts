import type {
  EventStyle,
  FlowerRole,
  FlowerVariant,
  SelectedFlower,
  Swatch,
} from "@/lib/types";
import { COLOR_FIT_DISTANCE_SCALE, VISUAL_FIT_WEIGHTS } from "@/lib/color/constants";
import { hexDistanceOkLab } from "@/lib/color/culori-bridge";

export type VisualFitBand = "high" | "good" | "explore";

export interface RankedCandidate {
  variant: FlowerVariant;
  score: number;
  colorFit: number;
  roleFit: number;
  styleFit: number;
  textureFit: number;
  nearestSwatchId: string | null;
  nearestSwatchName: string | null;
  nearestSwatchRole: Swatch["role"] | null;
  reasons: string[];
  band: VisualFitBand;
}

export interface FlowerFilters {
  query: string;
  role: FlowerRole | "all";
  colorFamily: FlowerVariant["colorFamily"] | "all";
  style: EventStyle | "all";
  hideUnavailable: boolean;
}

const collator = new Intl.Collator("en", { sensitivity: "base" });

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function visualFitBand(score: number): VisualFitBand {
  if (score >= 80) return "high";
  if (score >= 60) return "good";
  return "explore";
}

export function visualFitLabel(score: number): string {
  const band = visualFitBand(score);
  if (band === "high") return "High visual fit";
  if (band === "good") return "Good visual fit";
  return "Explore contrast";
}

export function missingRoles(selected: SelectedFlower[]): FlowerRole[] {
  const present = new Set(selected.map((item) => item.role));
  const roles: FlowerRole[] = ["focal", "support", "filler", "line", "foliage"];
  if (selected.length === 0) {
    return roles;
  }
  return roles.filter((role) => !present.has(role));
}

function eligibleSwatches(variant: FlowerVariant, swatches: Swatch[]): Swatch[] {
  if (variant.allowedRoles.length === 1 && variant.allowedRoles[0] === "foliage") {
    return swatches.filter((swatch) => swatch.role === "foliage");
  }
  const usable = swatches.filter(
    (swatch) =>
      swatch.role !== "foliage" &&
      swatch.proportion > 0 &&
      (swatch.role === "primary" ||
        swatch.role === "support" ||
        swatch.role === "accent" ||
        swatch.role === "neutral"),
  );
  if (usable.length === 0) {
    const primary = swatches.find((swatch) => swatch.role === "primary");
    return primary ? [primary] : [];
  }
  return usable;
}

function nearestSwatch(variant: FlowerVariant, swatches: Swatch[]): {
  swatch: Swatch | null;
  distance: number;
} {
  const candidates = eligibleSwatches(variant, swatches);
  if (candidates.length === 0) {
    return { swatch: null, distance: 1 };
  }
  let best = candidates[0];
  let bestDistance = hexDistanceOkLab(variant.approximateHex, best.hex);
  for (const swatch of candidates.slice(1)) {
    const distance = hexDistanceOkLab(variant.approximateHex, swatch.hex);
    if (distance < bestDistance) {
      best = swatch;
      bestDistance = distance;
    }
  }
  return { swatch: best, distance: bestDistance };
}

function colorFitFromDistance(distance: number): number {
  return Math.max(0, 1 - distance / COLOR_FIT_DISTANCE_SCALE);
}

function textureFit(
  variant: FlowerVariant,
  selected: SelectedFlower[],
  catalog: FlowerVariant[],
): number {
  if (!variant.texture) {
    return 0.5;
  }
  const used = new Set(
    selected
      .map((item) => catalog.find((entry) => entry.id === item.variantId)?.texture)
      .filter((texture): texture is string => Boolean(texture)),
  );
  return used.has(variant.texture) ? 0.4 : 1;
}

function styleFit(variant: FlowerVariant, eventStyle: EventStyle | null): number {
  if (!eventStyle || variant.styleTags.length === 0) {
    return 0.5;
  }
  return variant.styleTags.includes(eventStyle) ? 1 : 0;
}

function roleFitValue(
  variant: FlowerVariant,
  targetRole: FlowerRole | "all",
  selected: SelectedFlower[],
): number {
  if (targetRole !== "all") {
    return 1;
  }
  const missing = missingRoles(selected);
  const fillsMissing = variant.allowedRoles.some((role) => missing.includes(role));
  return fillsMissing ? 1 : 0.4;
}

export function buildReasons(candidate: {
  colorFit: number;
  nearestSwatchName: string | null;
  nearestSwatchRole: Swatch["role"] | null;
  roleFit: number;
  targetRole: FlowerRole | "all";
  fillsMissingRole: FlowerRole | null;
  textureFit: number;
  texture: string | null;
}): string[] {
  const reasons: string[] = [];
  if (candidate.colorFit >= 0.75 && candidate.nearestSwatchName) {
    const name = candidate.nearestSwatchName.toLowerCase();
    const role =
      candidate.nearestSwatchRole === "accent" && !name.includes("accent")
        ? " accent"
        : "";
    reasons.push(`Closest to your ${name}${role}`);
  }
  if (candidate.fillsMissingRole) {
    reasons.push(`Adds a missing ${candidate.fillsMissingRole} role`);
  }
  if (candidate.textureFit === 1 && candidate.texture) {
    reasons.push(
      `Adds ${articleFor(candidate.texture)} ${candidate.texture} texture`,
    );
  }
  return reasons.slice(0, 2);
}

export function rankCandidates(options: {
  catalog: FlowerVariant[];
  swatches: Swatch[];
  selected: SelectedFlower[];
  eventStyle: EventStyle | null;
  filters: FlowerFilters;
  availabilityByVariant?: Record<string, SelectedFlower["availability"]>;
}): RankedCandidate[] {
  const selectedIds = new Set(options.selected.map((item) => item.variantId));
  const query = options.filters.query.trim().toLowerCase();
  const missing = missingRoles(options.selected);

  const filtered = options.catalog.filter((variant) => {
    if (!variant.active) return false;
    if (selectedIds.has(variant.id)) return false;
    if (query) {
      const haystack = `${variant.commonName} ${variant.variantName}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (
      options.filters.role !== "all" &&
      !variant.allowedRoles.includes(options.filters.role)
    ) {
      return false;
    }
    if (
      options.filters.colorFamily !== "all" &&
      variant.colorFamily !== options.filters.colorFamily
    ) {
      return false;
    }
    if (
      options.filters.style !== "all" &&
      !variant.styleTags.includes(options.filters.style)
    ) {
      return false;
    }
    if (options.filters.hideUnavailable) {
      const availability = options.availabilityByVariant?.[variant.id];
      if (availability === "unavailable") return false;
    }
    return true;
  });

  const ranked = filtered.map((variant) => {
    const nearest = nearestSwatch(variant, options.swatches);
    const colorFit = colorFitFromDistance(nearest.distance);
    const roleFit = roleFitValue(
      variant,
      options.filters.role,
      options.selected,
    );
    const nextStyleFit = styleFit(variant, options.eventStyle);
    const nextTextureFit = textureFit(variant, options.selected, options.catalog);
    const fillsMissingRole =
      options.filters.role === "all"
        ? (variant.allowedRoles.find((role) => missing.includes(role)) ?? null)
        : null;
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 *
            (VISUAL_FIT_WEIGHTS.color * colorFit +
              VISUAL_FIT_WEIGHTS.role * roleFit +
              VISUAL_FIT_WEIGHTS.style * nextStyleFit +
              VISUAL_FIT_WEIGHTS.texture * nextTextureFit),
        ),
      ),
    );
    const reasons = buildReasons({
      colorFit,
      nearestSwatchName: nearest.swatch?.name ?? null,
      nearestSwatchRole: nearest.swatch?.role ?? null,
      roleFit,
      targetRole: options.filters.role,
      fillsMissingRole,
      textureFit: nextTextureFit,
      texture: variant.texture,
    });
    return {
      variant,
      score,
      colorFit,
      roleFit,
      styleFit: nextStyleFit,
      textureFit: nextTextureFit,
      nearestSwatchId: nearest.swatch?.id ?? null,
      nearestSwatchName: nearest.swatch?.name ?? null,
      nearestSwatchRole: nearest.swatch?.role ?? null,
      reasons,
      band: visualFitBand(score),
    };
  });

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const common = collator.compare(a.variant.commonName, b.variant.commonName);
    if (common !== 0) return common;
    const variant = collator.compare(
      a.variant.variantName,
      b.variant.variantName,
    );
    if (variant !== 0) return variant;
    return collator.compare(a.variant.id, b.variant.id);
  });

  return ranked;
}

export function colorFitOnly(variantHex: string, paletteHex: string): number {
  return colorFitFromDistance(hexDistanceOkLab(variantHex, paletteHex));
}

export function nearestPaletteSwatch(
  variant: FlowerVariant,
  swatches: Swatch[],
): Swatch | null {
  return nearestSwatch(variant, swatches).swatch;
}
