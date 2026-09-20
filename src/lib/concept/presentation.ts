import type { Project, ProjectPayload } from "@/lib/types";

export interface PresentationConcept {
  title: string;
  eventDate: string | null;
  location: string;
  style: string | null;
  palette: Array<{ name: string; hex: string; proportion: number; role: string }>;
  flowers: Array<{
    commonName: string;
    variantName: string;
    hex: string;
    role: string;
  }>;
  elements: Array<{ key: string; colorName: string; hex: string; materialNote: string }>;
  presentationNotes: string;
  toConfirm: string[];
  revision: number;
}

export function toPresentation(project: Project): PresentationConcept {
  const swatchById = new Map(
    project.payload.palette.swatches.map((swatch) => [swatch.id, swatch]),
  );
  const toConfirm = project.payload.selectedFlowers.flatMap((flower) => {
    const notes: string[] = [];
    if (flower.availability !== "confirmed") {
      notes.push(`${flower.snapshot.variantName}: availability needs review`);
    }
    for (const check of flower.practicalChecks) {
      if (check.status === "needsReview") {
        notes.push(`${flower.snapshot.variantName}: ${check.kind} needs review`);
      }
    }
    return notes;
  });
  return {
    title: project.name,
    eventDate: project.payload.brief.eventDate,
    location: project.payload.brief.location,
    style: project.payload.brief.style,
    palette: project.payload.palette.swatches.map((swatch) => ({
      name: swatch.name,
      hex: swatch.hex,
      proportion: swatch.proportion,
      role: swatch.role,
    })),
    flowers: project.payload.selectedFlowers.map((flower) => ({
      commonName: flower.snapshot.commonName,
      variantName: flower.snapshot.variantName,
      hex: flower.snapshot.approximateHex,
      role: flower.role,
    })),
    elements: project.payload.elements.map((element) => {
      const swatch = swatchById.get(element.swatchId);
      return {
        key: element.key,
        colorName: swatch?.name ?? "Unassigned",
        hex: swatch?.hex ?? "#FFFFFF",
        materialNote: element.materialNote,
      };
    }),
    presentationNotes: project.payload.presentationNotes,
    toConfirm,
    revision: project.version,
  };
}

export function presentationContainsInternalNotes(
  html: string,
  payload: ProjectPayload,
): boolean {
  if (!payload.brief.internalNotes.trim()) {
    return false;
  }
  return html.includes(payload.brief.internalNotes);
}
