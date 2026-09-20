import { DEFAULT_PROPORTIONS } from "@/lib/color/constants";
import type {
  ConceptElement,
  FlowerRole,
  FlowerVariant,
  PracticalCheck,
  Project,
  ProjectPayload,
  SelectedFlower,
  Swatch,
} from "@/lib/types";
import { PALETTE_PRESETS } from "@/data/demo/presets";
import { FLOWER_CATALOG } from "@/data/demo/catalog";

export const DEMO_WORKSPACE = {
  id: "demo-workspace",
  name: "Florence Studio",
  currencyCode: "USD",
  timeZone: "America/New_York",
};

export const FOREIGN_WORKSPACE = {
  id: "other-workspace",
  name: "Other Studio",
};

export function createId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(16)}`;
}

export function emptyPracticalChecks(): PracticalCheck[] {
  return [
    { kind: "scent", status: "needsReview", note: "" },
    { kind: "exposure", status: "needsReview", note: "" },
    { kind: "conditioning", status: "needsReview", note: "" },
    { kind: "supplier", status: "needsReview", note: "" },
  ];
}

export function swatchesFromPreset(
  presetId = "garden-romance",
  idFactory: (role: Swatch["role"]) => string = (role) => createId(role),
): Swatch[] {
  const preset =
    PALETTE_PRESETS.find((item) => item.id === presetId) ?? PALETTE_PRESETS[0];
  return preset.swatches.map((swatch, index) => ({
    id: idFactory(swatch.role),
    role: swatch.role,
    name: swatch.name,
    hex: swatch.hex,
    locked: false,
    proportion: DEFAULT_PROPORTIONS[index],
  }));
}

export function defaultElements(swatches: Swatch[]): ConceptElement[] {
  const byRole = Object.fromEntries(
    swatches.map((swatch) => [swatch.role, swatch.id]),
  ) as Record<Swatch["role"], string>;
  return [
    { key: "backdrop", swatchId: byRole.primary, materialNote: "" },
    { key: "linen", swatchId: byRole.neutral, materialNote: "" },
    { key: "floralEmphasis", swatchId: byRole.support, materialNote: "" },
    { key: "stationery", swatchId: byRole.neutral, materialNote: "" },
    { key: "accents", swatchId: byRole.accent, materialNote: "" },
  ];
}

export function createDefaultPayload(
  idFactory: (role: Swatch["role"]) => string = (role) => createId(role),
): ProjectPayload {
  const swatches = swatchesFromPreset("garden-romance", idFactory);
  return {
    schemaVersion: 1,
    brief: {
      clientDisplayName: "",
      eventType: "other",
      eventDate: null,
      location: "",
      environment: "unknown",
      style: null,
      internalNotes: "",
    },
    palette: {
      mode: "analogous",
      generationIndex: 0,
      swatches,
    },
    selectedFlowers: [],
    elements: defaultElements(swatches),
    presentationNotes: "",
  };
}

export function selectedFlowerFromCatalog(
  variant: FlowerVariant,
  role: FlowerRole,
  id = createId("flower"),
): SelectedFlower {
  return {
    id,
    variantId: variant.id,
    role,
    snapshot: {
      commonName: variant.commonName,
      variantName: variant.variantName,
      approximateHex: variant.approximateHex,
      imagePath: variant.imagePath,
      catalogVersion: variant.catalogVersion,
    },
    availability: "unknown",
    availabilityNote: "",
    availabilityContext: null,
    practicalChecks: emptyPracticalChecks(),
  };
}

function catalogById(id: string): FlowerVariant {
  const found = FLOWER_CATALOG.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Missing catalog fixture ${id}`);
  }
  return found;
}

export function createGardenDinnerProject(): Project {
  const swatches = swatchesFromPreset("garden-romance", (role) => `garden-${role}`);
  const payload: ProjectPayload = {
    schemaVersion: 1,
    brief: {
      clientDisplayName: "Garden Dinner client",
      eventType: "social",
      eventDate: null,
      location: "Sample venue",
      environment: "indoor",
      style: "romantic",
      internalNotes: "Staff-only reminder: confirm venue lighting on site.",
    },
    palette: {
      mode: "analogous",
      generationIndex: 0,
      swatches,
    },
    selectedFlowers: [
      selectedFlowerFromCatalog(catalogById("rose-blush"), "focal", "sel-rose-blush"),
      selectedFlowerFromCatalog(
        catalogById("lisianthus-white"),
        "support",
        "sel-lisianthus-white",
      ),
      selectedFlowerFromCatalog(
        catalogById("gypsophila-white"),
        "filler",
        "sel-gypsophila-white",
      ),
      selectedFlowerFromCatalog(
        catalogById("eucalyptus-green"),
        "foliage",
        "sel-eucalyptus-green",
      ),
    ],
    elements: defaultElements(swatches),
    presentationNotes: "A garden-led table for an indoor dinner.",
  };
  return {
    id: "demo-garden-dinner",
    workspaceId: DEMO_WORKSPACE.id,
    createdBy: "demo-editor",
    name: "Garden Dinner",
    status: "draft",
    payload,
    version: 1,
    createdAt: "2026-09-20T12:00:00.000Z",
    updatedAt: "2026-09-20T12:00:00.000Z",
  };
}

export function createForeignProject(): Project {
  const payload = createDefaultPayload((role) => `foreign-${role}`);
  return {
    id: "foreign-project",
    workspaceId: FOREIGN_WORKSPACE.id,
    createdBy: "foreign-user",
    name: "Private other workspace event",
    status: "draft",
    payload,
    version: 1,
    createdAt: "2026-09-20T12:00:00.000Z",
    updatedAt: "2026-09-20T12:00:00.000Z",
  };
}

export function copyName(name: string): string {
  const suffix = " Copy";
  if (name.length + suffix.length <= 100) {
    return `${name}${suffix}`;
  }
  return `${name.slice(0, 100 - suffix.length)}${suffix}`;
}

export function duplicateProjectRecord(project: Project, actorId: string): Project {
  const idMap = new Map<string, string>();
  const swatches = project.payload.palette.swatches.map((swatch) => {
    const nextId = createId(swatch.role);
    idMap.set(swatch.id, nextId);
    return { ...swatch, id: nextId };
  });
  const now = new Date().toISOString();
  return {
    id: createId("project"),
    workspaceId: project.workspaceId,
    createdBy: actorId,
    name: copyName(project.name),
    status: "draft",
    version: 1,
    createdAt: now,
    updatedAt: now,
    payload: {
      ...project.payload,
      palette: {
        ...project.payload.palette,
        swatches,
      },
      selectedFlowers: project.payload.selectedFlowers.map((flower) => ({
        ...flower,
        id: createId("flower"),
        availability: "unknown",
        availabilityNote: flower.availabilityNote,
        availabilityContext: null,
        practicalChecks: emptyPracticalChecks(),
      })),
      elements: project.payload.elements.map((element) => ({
        ...element,
        swatchId: idMap.get(element.swatchId) ?? swatches[0].id,
      })),
    },
  };
}

export function invalidateAvailabilityOnContextChange(
  payload: ProjectPayload,
  previous: { eventDate: string | null; location: string },
): ProjectPayload {
  const nextDate = payload.brief.eventDate;
  const nextLocation = payload.brief.location;
  if (nextDate === previous.eventDate && nextLocation === previous.location) {
    return payload;
  }
  return {
    ...payload,
    selectedFlowers: payload.selectedFlowers.map((flower) => {
      if (flower.availability === "unknown" && !flower.availabilityContext) {
        return flower;
      }
      const history = flower.availabilityNote
        ? `Previous note: ${flower.availabilityNote}`
        : "Previous confirmation cleared after date or location change.";
      return {
        ...flower,
        availability: "unknown",
        availabilityNote: history,
        availabilityContext: null,
      };
    }),
  };
}
