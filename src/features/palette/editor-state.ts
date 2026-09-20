import { FLOWER_CATALOG } from "@/data/demo/catalog";
import { PALETTE_PRESETS } from "@/data/demo/presets";
import { selectedFlowerFromCatalog } from "@/data/demo/project";
import {
  allSwatchesLocked,
  applyPresetToSwatches,
  generatePalette,
  parseHexInput,
} from "@/lib/color";
import { normalizeProportions, proportionsAreValid } from "@/lib/color/proportions";
import { invalidateAvailabilityOnContextChange } from "@/data/demo/project";
import type {
  FlowerRole,
  Harmony,
  Project,
  ProjectPayload,
  SaveStatus,
  SelectedFlower,
  Swatch,
} from "@/lib/types";
import type { FlowerFilters } from "@/lib/matching";
import { HEX_HELP } from "@/lib/color/constants";

export interface EditorState {
  project: Project;
  selectedSwatchId: string;
  hexDraft: string;
  hexError: string | null;
  proportionDrafts: number[];
  history: ProjectPayload["palette"][];
  saveStatus: SaveStatus;
  conflictVersion?: number;
  liveMessage: string;
  explanation: string;
  curatedPreset: boolean;
  filters: FlowerFilters;
  inFlight: boolean;
  queued: boolean;
}

function paletteOf(project: Project): ProjectPayload["palette"] {
  return project.payload.palette;
}

function selectedSwatch(state: EditorState): Swatch {
  return (
    paletteOf(state.project).swatches.find(
      (swatch) => swatch.id === state.selectedSwatchId,
    ) ?? paletteOf(state.project).swatches[0]
  );
}

function clonePalette(palette: ProjectPayload["palette"]) {
  return structuredClone(palette);
}

function commitProject(state: EditorState, project: Project, extras: Partial<EditorState> = {}): EditorState {
  return {
    ...state,
    project,
    saveStatus: "unsaved",
    ...extras,
  };
}

export function createEditorState(project: Project): EditorState {
  const swatch = project.payload.palette.swatches[0];
  return {
    project,
    selectedSwatchId: swatch.id,
    hexDraft: swatch.hex,
    hexError: null,
    proportionDrafts: project.payload.palette.swatches.map((item) => item.proportion),
    history: [],
    saveStatus: "saved",
    liveMessage: "",
    explanation: "Curated preset",
    curatedPreset: true,
    filters: {
      query: "",
      role: "all",
      colorFamily: "all",
      style: "all",
      hideUnavailable: false,
    },
    inFlight: false,
    queued: false,
  };
}

function pushHistory(state: EditorState): ProjectPayload["palette"][] {
  return [...state.history, clonePalette(state.project.payload.palette)].slice(-20);
}

function replaceSwatches(project: Project, swatches: Swatch[]): Project {
  return {
    ...project,
    payload: {
      ...project.payload,
      palette: { ...project.payload.palette, swatches },
    },
  };
}

export type EditorAction =
  | { type: "hydrate"; project: Project }
  | { type: "selectSwatch"; id: string }
  | { type: "draftHex"; value: string }
  | { type: "commitHex" }
  | { type: "commitPicker"; hex: string }
  | { type: "toggleLock" }
  | { type: "renameSwatch"; name: string }
  | { type: "setProportion"; index: number; value: number }
  | { type: "normalizeProportions" }
  | { type: "generate" }
  | { type: "applyPreset"; presetId: string }
  | { type: "undo" }
  | { type: "setMode"; mode: Harmony }
  | { type: "updateBrief"; brief: Partial<ProjectPayload["brief"]> }
  | { type: "setName"; name: string }
  | { type: "addFlower"; variantId: string; role: FlowerRole }
  | { type: "removeFlower"; id: string }
  | { type: "setFlowerRole"; id: string; role: FlowerRole }
  | { type: "patchFlower"; id: string; patch: Partial<SelectedFlower> }
  | { type: "setElement"; key: ProjectPayload["elements"][number]["key"]; swatchId: string; materialNote?: string }
  | { type: "setPresentationNotes"; notes: string }
  | { type: "setFilters"; filters: Partial<FlowerFilters> }
  | { type: "markSaving" }
  | { type: "queueSave" }
  | { type: "markSaved"; project: Project }
  | { type: "markFailed"; message: string }
  | { type: "markConflict"; version: number }
  | { type: "setLive"; message: string }
  | { type: "applyPrimaryFromFlower"; hex: string; unlockPrimary?: boolean };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "hydrate":
      return createEditorState(action.project);
    case "selectSwatch": {
      const swatch =
        paletteOf(state.project).swatches.find((item) => item.id === action.id) ??
        selectedSwatch(state);
      return {
        ...state,
        selectedSwatchId: swatch.id,
        hexDraft: swatch.hex,
        hexError: null,
      };
    }
    case "draftHex": {
      const parsed = parseHexInput(action.value);
      return {
        ...state,
        hexDraft: action.value,
        hexError: parsed.ok ? null : parsed.message,
      };
    }
    case "commitHex": {
      const parsed = parseHexInput(state.hexDraft);
      if (!parsed.ok) {
        return { ...state, hexError: parsed.message || HEX_HELP };
      }
      const current = selectedSwatch(state);
      if (current.hex === parsed.hex) {
        return { ...state, hexDraft: parsed.hex, hexError: null };
      }
      const swatches = paletteOf(state.project).swatches.map((swatch) =>
        swatch.id === current.id ? { ...swatch, hex: parsed.hex } : swatch,
      );
      const generationIndex =
        current.role === "primary" ? 0 : state.project.payload.palette.generationIndex;
      return commitProject(
        state,
        {
          ...replaceSwatches(state.project, swatches),
          payload: {
            ...replaceSwatches(state.project, swatches).payload,
            palette: {
              ...replaceSwatches(state.project, swatches).payload.palette,
              generationIndex,
            },
          },
        },
        {
          history: pushHistory(state),
          hexDraft: parsed.hex,
          hexError: null,
          curatedPreset: false,
          liveMessage: `${current.name} set to ${parsed.hex}`,
        },
      );
    }
    case "commitPicker": {
      const parsed = parseHexInput(action.hex);
      if (!parsed.ok) return state;
      return editorReducer(
        { ...state, hexDraft: parsed.hex },
        { type: "commitHex" },
      );
    }
    case "toggleLock": {
      const swatches = paletteOf(state.project).swatches.map((swatch) =>
        swatch.id === state.selectedSwatchId
          ? { ...swatch, locked: !swatch.locked }
          : swatch,
      );
      return commitProject(state, replaceSwatches(state.project, swatches));
    }
    case "renameSwatch": {
      const swatches = paletteOf(state.project).swatches.map((swatch) =>
        swatch.id === state.selectedSwatchId
          ? { ...swatch, name: action.name.slice(0, 40) }
          : swatch,
      );
      return commitProject(state, replaceSwatches(state.project, swatches));
    }
    case "setProportion": {
      const drafts = [...state.proportionDrafts];
      drafts[action.index] = action.value;
      if (!proportionsAreValid(drafts)) {
        return { ...state, proportionDrafts: drafts };
      }
      const swatches = paletteOf(state.project).swatches.map((swatch, index) => ({
        ...swatch,
        proportion: drafts[index],
      }));
      return commitProject(state, replaceSwatches(state.project, swatches), {
        proportionDrafts: drafts,
      });
    }
    case "normalizeProportions": {
      const drafts = normalizeProportions(state.proportionDrafts);
      const swatches = paletteOf(state.project).swatches.map((swatch, index) => ({
        ...swatch,
        proportion: drafts[index],
      }));
      return commitProject(state, replaceSwatches(state.project, swatches), {
        proportionDrafts: drafts,
      });
    }
    case "generate": {
      if (allSwatchesLocked(paletteOf(state.project).swatches)) {
        return {
          ...state,
          explanation: "All colors are locked, so generation and presets cannot change them.",
        };
      }
      const result = generatePalette({
        swatches: paletteOf(state.project).swatches,
        mode: paletteOf(state.project).mode,
        generationIndex: paletteOf(state.project).generationIndex,
      });
      const nextProject = {
        ...state.project,
        payload: {
          ...state.project.payload,
          palette: {
            ...state.project.payload.palette,
            swatches: result.swatches,
            generationIndex: result.nextGenerationIndex,
          },
        },
      };
      const selected =
        result.swatches.find((swatch) => swatch.id === state.selectedSwatchId) ??
        result.swatches[0];
      return commitProject(state, nextProject, {
        history: pushHistory(state),
        hexDraft: selected.hex,
        explanation: result.warnings[0] ?? `${paletteOf(state.project).mode} harmony applied to unlocked colors.`,
        curatedPreset: false,
        liveMessage: "Palette alternatives generated.",
      });
    }
    case "applyPreset": {
      if (allSwatchesLocked(paletteOf(state.project).swatches)) {
        return {
          ...state,
          explanation: "All colors are locked, so generation and presets cannot change them.",
        };
      }
      const preset = PALETTE_PRESETS.find((item) => item.id === action.presetId);
      if (!preset) return state;
      const applied = applyPresetToSwatches(
        paletteOf(state.project).swatches,
        preset.swatches,
      );
      const nextProject = {
        ...state.project,
        payload: {
          ...state.project.payload,
          palette: {
            ...state.project.payload.palette,
            swatches: applied.swatches,
            generationIndex: 0,
            mode: "analogous" as const,
          },
        },
      };
      const selected =
        applied.swatches.find((swatch) => swatch.id === state.selectedSwatchId) ??
        applied.swatches[0];
      return commitProject(state, nextProject, {
        history: pushHistory(state),
        hexDraft: selected.hex,
        curatedPreset: true,
        explanation:
          applied.unchangedLocked > 0
            ? `${applied.unchangedLocked === 2 ? "Two locked colors" : `${applied.unchangedLocked} locked color${applied.unchangedLocked === 1 ? "" : "s"}`} will stay unchanged`
            : "Curated preset",
        liveMessage: `${preset.name} applied.`,
      });
    }
    case "undo": {
      const previous = state.history.at(-1);
      if (!previous) return state;
      const nextProject = {
        ...state.project,
        payload: { ...state.project.payload, palette: previous },
      };
      const selected =
        previous.swatches.find((swatch) => swatch.id === state.selectedSwatchId) ??
        previous.swatches[0];
      return commitProject(state, nextProject, {
        history: state.history.slice(0, -1),
        hexDraft: selected.hex,
        proportionDrafts: previous.swatches.map((swatch) => swatch.proportion),
        liveMessage: "Palette restored.",
        curatedPreset: false,
      });
    }
    case "setMode":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          palette: { ...state.project.payload.palette, mode: action.mode },
        },
      });
    case "updateBrief": {
      const nextPayload = invalidateAvailabilityOnContextChange(
        {
          ...state.project.payload,
          brief: { ...state.project.payload.brief, ...action.brief },
        },
        {
          eventDate: state.project.payload.brief.eventDate,
          location: state.project.payload.brief.location,
        },
      );
      return commitProject(state, {
        ...state.project,
        payload: nextPayload,
      });
    }
    case "setName":
      return commitProject(state, { ...state.project, name: action.name.slice(0, 100) });
    case "addFlower": {
      if (state.project.payload.selectedFlowers.some((item) => item.variantId === action.variantId)) {
        return state;
      }
      if (state.project.payload.selectedFlowers.length >= 8) {
        return { ...state, liveMessage: "A combination can include up to eight flowers." };
      }
      const variant = FLOWER_CATALOG.find((item) => item.id === action.variantId);
      if (!variant || !variant.allowedRoles.includes(action.role)) {
        return state;
      }
      const flower = selectedFlowerFromCatalog(variant, action.role);
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          selectedFlowers: [...state.project.payload.selectedFlowers, flower],
        },
      });
    }
    case "removeFlower":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          selectedFlowers: state.project.payload.selectedFlowers.filter(
            (flower) => flower.id !== action.id,
          ),
        },
      });
    case "setFlowerRole":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          selectedFlowers: state.project.payload.selectedFlowers.map((flower) =>
            flower.id === action.id ? { ...flower, role: action.role } : flower,
          ),
        },
      });
    case "patchFlower":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          selectedFlowers: state.project.payload.selectedFlowers.map((flower) =>
            flower.id === action.id ? { ...flower, ...action.patch } : flower,
          ),
        },
      });
    case "setElement":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          elements: state.project.payload.elements.map((element) =>
            element.key === action.key
              ? {
                  ...element,
                  swatchId: action.swatchId,
                  materialNote:
                    action.materialNote ?? element.materialNote,
                }
              : element,
          ),
        },
      });
    case "setPresentationNotes":
      return commitProject(state, {
        ...state.project,
        payload: {
          ...state.project.payload,
          presentationNotes: action.notes.slice(0, 2000),
        },
      });
    case "setFilters":
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case "markSaving":
      return { ...state, saveStatus: "saving", inFlight: true };
    case "queueSave":
      return { ...state, queued: true };
    case "markSaved": {
      const selected =
        action.project.payload.palette.swatches.find(
          (swatch) => swatch.id === state.selectedSwatchId,
        ) ?? action.project.payload.palette.swatches[0];
      return {
        ...state,
        project: {
          ...action.project,
          payload: state.queued ? state.project.payload : action.project.payload,
          name: state.queued ? state.project.name : action.project.name,
          status: state.queued ? state.project.status : action.project.status,
          version: action.project.version,
        },
        saveStatus: state.queued ? "unsaved" : "saved",
        inFlight: false,
        queued: false,
        selectedSwatchId: selected.id,
        liveMessage: state.queued ? state.liveMessage : "Saved",
      };
    }
    case "markFailed":
      return {
        ...state,
        saveStatus: "failed",
        inFlight: false,
        liveMessage: action.message,
      };
    case "markConflict":
      return {
        ...state,
        saveStatus: "conflict",
        inFlight: false,
        conflictVersion: action.version,
        liveMessage: "This event changed in another session.",
      };
    case "setLive":
      return { ...state, liveMessage: action.message };
    case "applyPrimaryFromFlower": {
      const current = paletteOf(state.project).swatches;
      const unlocked = action.unlockPrimary
        ? current.map((swatch) =>
            swatch.role === "primary" ? { ...swatch, locked: false } : swatch,
          )
        : current;
      const primary = unlocked.find((swatch) => swatch.role === "primary")!;
      if (primary.locked) {
        return state;
      }
      const withPrimary = unlocked.map((swatch) =>
        swatch.role === "primary" ? { ...swatch, hex: action.hex } : swatch,
      );
      const generated = generatePalette({
        swatches: withPrimary,
        mode: paletteOf(state.project).mode,
        generationIndex: 0,
      });
      const nextProject = {
        ...state.project,
        payload: {
          ...state.project.payload,
          palette: {
            ...state.project.payload.palette,
            swatches: generated.swatches,
            generationIndex: generated.nextGenerationIndex,
          },
        },
      };
      return commitProject(state, nextProject, {
        history: pushHistory(state),
        hexDraft: action.hex,
        curatedPreset: false,
        explanation: "Primary updated from a flower. Locked colors were kept.",
        liveMessage: "Primary color updated.",
      });
    }
    default:
      return state;
  }
}

export function proportionsNeedNormalize(state: EditorState): boolean {
  return !proportionsAreValid(state.proportionDrafts);
}
