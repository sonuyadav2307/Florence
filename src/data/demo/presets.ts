import type { PalettePreset } from "@/lib/types";

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "garden-romance",
    name: "Garden Romance",
    curated: true,
    swatches: [
      { role: "primary", name: "Blush", hex: "#D8A7B1" },
      { role: "support", name: "Sand", hex: "#E8C7B8" },
      { role: "accent", name: "Rosewood", hex: "#8B4D65" },
      { role: "neutral", name: "Ivory", hex: "#F4EFE7" },
      { role: "foliage", name: "Sage", hex: "#71816A" },
    ],
  },
  {
    id: "modern-evening",
    name: "Modern Evening",
    curated: true,
    swatches: [
      { role: "primary", name: "Navy", hex: "#273A53" },
      { role: "support", name: "Mist", hex: "#A8BAC8" },
      { role: "accent", name: "Bronze", hex: "#B78A52" },
      { role: "neutral", name: "Parchment", hex: "#F3F0E8" },
      { role: "foliage", name: "Forest", hex: "#425B4D" },
    ],
  },
  {
    id: "citrus-celebration",
    name: "Citrus Celebration",
    curated: true,
    swatches: [
      { role: "primary", name: "Citrus", hex: "#EDB949" },
      { role: "support", name: "Melon", hex: "#F1AA84" },
      { role: "accent", name: "Coral", hex: "#C85A50" },
      { role: "neutral", name: "Cream", hex: "#FFF4DD" },
      { role: "foliage", name: "Olive", hex: "#738357" },
    ],
  },
];
