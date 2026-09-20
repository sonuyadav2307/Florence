import { contrastRatio } from "./culori-bridge";

export function swatchLabelColor(hex: string): "#000000" | "#FFFFFF" {
  const black = contrastRatio("#000000", hex);
  const white = contrastRatio("#FFFFFF", hex);
  return white >= black ? "#FFFFFF" : "#000000";
}

export interface StationeryContrastFlags {
  normalTextFails: boolean;
  largeTextFails: boolean;
  normalRatio: number;
  largeRatio: number;
}

export function stationeryContrastFlags(
  backgroundHex: string,
  textHex = "#242B27",
): StationeryContrastFlags {
  const ratio = contrastRatio(textHex, backgroundHex);
  return {
    normalTextFails: ratio < 4.5,
    largeTextFails: ratio < 3,
    normalRatio: ratio,
    largeRatio: ratio,
  };
}
