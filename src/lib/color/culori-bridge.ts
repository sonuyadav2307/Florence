import {
  converter,
  differenceEuclidean,
  formatHex,
  toGamut,
  wcagContrast,
} from "culori";
import { isNormalizedHex } from "./hex";

const toOklch = converter("oklch");
const toOklab = converter("oklab");
const mapToSrgb = toGamut("rgb");
const oklabDistance = differenceEuclidean("oklab");

export interface OklchColor {
  l: number;
  c: number;
  h: number | undefined;
}

export function hexToOklch(hex: string): OklchColor {
  const color = toOklch(hex);
  if (!color) {
    return { l: 0.5, c: 0, h: undefined };
  }
  return {
    l: typeof color.l === "number" && Number.isFinite(color.l) ? color.l : 0.5,
    c: typeof color.c === "number" && Number.isFinite(color.c) ? color.c : 0,
    h:
      typeof color.h === "number" && Number.isFinite(color.h)
        ? color.h
        : undefined,
  };
}

export function oklchToHex(l: number, c: number, h: number): string {
  const mapped = mapToSrgb({ mode: "oklch", l, c, h });
  const hex = formatHex(mapped);
  if (!hex) {
    return "#808080";
  }
  const normalized = hex.toUpperCase();
  return isNormalizedHex(normalized) ? normalized : "#808080";
}

export function hexDistanceOkLab(a: string, b: string): number {
  return oklabDistance(a, b);
}

export function contrastRatio(foreground: string, background: string): number {
  return wcagContrast(foreground, background);
}

export function toOklabChannels(hex: string): { l: number; a: number; b: number } {
  const color = toOklab(hex);
  return {
    l: typeof color?.l === "number" ? color.l : 0,
    a: typeof color?.a === "number" ? color.a : 0,
    b: typeof color?.b === "number" ? color.b : 0,
  };
}
