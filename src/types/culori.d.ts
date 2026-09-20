declare module "culori" {
  export type Color = {
    mode: string;
    [channel: string]: number | string | undefined;
  };

  export function converter(
    mode: string,
  ): (color: string | Color | undefined) => Color | undefined;
  export function formatHex(color: string | Color | undefined): string | undefined;
  export function toGamut(
    dest?: string,
    mode?: string,
    delta?: (a: Color, b: Color) => number,
    jnd?: number,
  ): (color: string | Color | undefined) => Color | undefined;
  export function differenceEuclidean(
    mode?: string,
    weights?: number[],
  ): (a: string | Color, b: string | Color) => number;
  export function wcagContrast(a: string | Color, b: string | Color): number;
}
