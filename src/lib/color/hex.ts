import { HEX_HELP } from "./constants";

const THREE = /^[0-9A-F]{3}$/;
const SIX = /^[0-9A-F]{6}$/;
const EIGHT = /^[0-9A-F]{8}$/;

export type HexParseResult =
  | { ok: true; hex: string }
  | { ok: false; message: string };

export function normalizeHex(value: string): string {
  const parsed = parseHexInput(value);
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }
  return parsed.hex;
}

export function parseHexInput(raw: string): HexParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: HEX_HELP };
  }
  if (/[<>()=]|url\(|var\(/i.test(trimmed)) {
    return { ok: false, message: HEX_HELP };
  }
  const body = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  const upper = body.toUpperCase();
  if (EIGHT.test(upper) || body.includes(".") || /[^0-9A-F]/i.test(body)) {
    return { ok: false, message: HEX_HELP };
  }
  if (THREE.test(upper)) {
    const [r, g, b] = upper;
    return { ok: true, hex: `#${r}${r}${g}${g}${b}${b}` };
  }
  if (SIX.test(upper)) {
    return { ok: true, hex: `#${upper}` };
  }
  return { ok: false, message: HEX_HELP };
}

export function isNormalizedHex(value: string): boolean {
  return /^#[0-9A-F]{6}$/.test(value);
}
