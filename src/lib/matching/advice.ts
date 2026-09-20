import type { FlowerVariant, SelectedFlower } from "@/lib/types";

export function combinationAdvice(
  selected: SelectedFlower[],
  catalog: FlowerVariant[],
): string[] {
  const messages: string[] = [];
  const focals = selected.filter((item) => item.role === "focal");
  if (focals.length === 0) {
    messages.push("Choose a focal flower if you want a clear center of attention.");
  }
  if (focals.length > 2) {
    messages.push("Several focal flowers may compete; review their proportions.");
  }
  const hasFillerOrLine = selected.some(
    (item) => item.role === "filler" || item.role === "line",
  );
  if (!hasFillerOrLine) {
    messages.push("Consider a filler or line flower for variation.");
  }
  const textures = selected
    .map((item) => catalog.find((entry) => entry.id === item.variantId)?.texture)
    .filter((texture): texture is string => Boolean(texture));
  if (
    textures.length >= 2 &&
    textures.every((texture) => texture === textures[0])
  ) {
    messages.push("A different texture could add variation.");
  }
  if (selected.some((item) => item.availability === "unavailable")) {
    messages.push("This concept includes a flower marked unavailable.");
  }
  return messages;
}

export function needsFoliage(selected: SelectedFlower[]): boolean {
  return !selected.some((item) => item.role === "foliage");
}
