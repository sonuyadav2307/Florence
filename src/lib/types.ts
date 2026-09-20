export type SwatchRole =
  | "primary"
  | "support"
  | "accent"
  | "neutral"
  | "foliage";

export type FlowerRole = "focal" | "support" | "filler" | "line" | "foliage";

export type Harmony =
  | "analogous"
  | "complementary"
  | "splitComplementary"
  | "triadic"
  | "monochromatic";

export type EventType =
  | "wedding"
  | "corporate"
  | "birthday"
  | "social"
  | "other";

export type EventEnvironment = "indoor" | "outdoor" | "mixed" | "unknown";

export type EventStyle =
  | "romantic"
  | "garden"
  | "modern"
  | "classic"
  | "vibrant";

export type ProjectStatus = "draft" | "ready" | "archived";

export type ColorFamily =
  | "pink"
  | "white"
  | "red"
  | "orange"
  | "purple"
  | "yellow"
  | "blue"
  | "green";

export type Availability = "unknown" | "confirmed" | "unavailable";

export type PracticalKind = "scent" | "exposure" | "conditioning" | "supplier";

export type PracticalStatus = "needsReview" | "reviewed";

export type ElementKey =
  | "backdrop"
  | "linen"
  | "floralEmphasis"
  | "stationery"
  | "accents";

export type WorkspaceRole = "admin" | "editor" | "viewer";

export interface Swatch {
  id: string;
  role: SwatchRole;
  name: string;
  hex: string;
  locked: boolean;
  proportion: number;
}

export interface PracticalCheck {
  kind: PracticalKind;
  status: PracticalStatus;
  note: string;
}

export interface SelectedFlower {
  id: string;
  variantId: string;
  role: FlowerRole;
  snapshot: {
    commonName: string;
    variantName: string;
    approximateHex: string;
    imagePath: string | null;
    catalogVersion: number;
  };
  availability: Availability;
  availabilityNote: string;
  availabilityContext: {
    eventDate: string | null;
    location: string | null;
    recordedAt: string;
  } | null;
  practicalChecks: PracticalCheck[];
}

export interface ConceptElement {
  key: ElementKey;
  swatchId: string;
  materialNote: string;
}

export interface ProjectPayload {
  schemaVersion: 1;
  brief: {
    clientDisplayName: string;
    eventType: EventType;
    eventDate: string | null;
    location: string;
    environment: EventEnvironment;
    style: EventStyle | null;
    internalNotes: string;
  };
  palette: {
    mode: Harmony;
    generationIndex: number;
    swatches: Swatch[];
  };
  selectedFlowers: SelectedFlower[];
  elements: ConceptElement[];
  presentationNotes: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  status: ProjectStatus;
  payload: ProjectPayload;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  eventDate: string | null;
  style: EventStyle | null;
  clientDisplayName: string;
  swatches: Array<{ id: string; hex: string; name: string }>;
  updatedAt: string;
}

export interface PracticalFact {
  kind: string;
  value: string | null;
  source: string | null;
  reviewedDate: string | null;
  regionalApplicability: string | null;
}

export interface FlowerVariant {
  id: string;
  speciesKey: string;
  commonName: string;
  variantName: string;
  approximateHex: string;
  imagePath: string | null;
  imageCredit: string | null;
  allowedRoles: FlowerRole[];
  texture: string | null;
  styleTags: EventStyle[];
  colorFamily: ColorFamily;
  editorialReview: "pending" | "reviewed";
  active: boolean;
  catalogVersion: number;
  catalogData: {
    practicalFacts: PracticalFact[];
  };
}

export interface PalettePreset {
  id: string;
  name: string;
  curated: true;
  swatches: Array<{
    role: SwatchRole;
    name: string;
    hex: string;
  }>;
}

export interface SessionUser {
  id: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  currencyCode: string;
  timeZone: string;
}

export type SaveStatus =
  | "saved"
  | "unsaved"
  | "saving"
  | "failed"
  | "conflict";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}
