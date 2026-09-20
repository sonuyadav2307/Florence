import { DEFAULT_PROPORTIONS, SWATCH_ROLES } from "./constants";

export function normalizeProportions(values: number[]): number[] {
  if (values.length !== 5) {
    throw new Error("Florence palettes require five proportions.");
  }
  const nonnegative = values.map((value) => Math.max(0, value));
  const sum = nonnegative.reduce((total, value) => total + value, 0);
  if (sum === 0) {
    return [...DEFAULT_PROPORTIONS];
  }
  const scaled = nonnegative.map((value) => (value / sum) * 100);
  const floors = scaled.map((value) => Math.floor(value));
  const remainders = scaled.map((value, index) => ({
    index,
    remainder: value - floors[index],
    roleOrder: index,
  }));
  const leftover = 100 - floors.reduce((total, value) => total + value, 0);
  remainders.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return a.roleOrder - b.roleOrder;
  });
  const result = [...floors];
  for (let i = 0; i < leftover; i += 1) {
    result[remainders[i].index] += 1;
  }
  return result;
}

export function proportionsAreValid(values: number[]): boolean {
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 100)) {
    return false;
  }
  return values.reduce((total, value) => total + value, 0) === 100;
}

export function roleOrderIndex(role: (typeof SWATCH_ROLES)[number]): number {
  return SWATCH_ROLES.indexOf(role);
}
