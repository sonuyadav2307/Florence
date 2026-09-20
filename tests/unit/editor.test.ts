import { describe, expect, it } from "vitest";
import { createGardenDinnerProject } from "@/data/demo/project";
import { createEditorState, editorReducer } from "@/features/palette/editor-state";

describe("editor reducer", () => {
  it("PAL 08 undoes one generation", () => {
    const project = createGardenDinnerProject();
    let state = createEditorState(project);
    const original = state.project.payload.palette.swatches.map((swatch) => swatch.hex);
    const originalIndex = state.project.payload.palette.generationIndex;
    state = editorReducer(state, { type: "generate" });
    expect(state.project.payload.palette.generationIndex).toBe(originalIndex + 1);
    state = editorReducer(state, { type: "undo" });
    expect(state.project.payload.palette.swatches.map((swatch) => swatch.hex)).toEqual(original);
    expect(state.project.payload.palette.generationIndex).toBe(originalIndex);
  });

  it("FLO 03 prevents adding the same variant twice", () => {
    const project = createGardenDinnerProject();
    let state = createEditorState(project);
    const before = state.project.payload.selectedFlowers.length;
    state = editorReducer(state, { type: "addFlower", variantId: "rose-blush", role: "focal" });
    expect(state.project.payload.selectedFlowers).toHaveLength(before);
  });

  it("FLO 04 resets availability when the event date changes", () => {
    const project = createGardenDinnerProject();
    project.payload.selectedFlowers[0].availability = "confirmed";
    project.payload.selectedFlowers[0].availabilityContext = {
      eventDate: null,
      location: "Sample venue",
      recordedAt: "2026-09-20T12:00:00.000Z",
    };
    let state = createEditorState(project);
    state = editorReducer(state, { type: "updateBrief", brief: { eventDate: "2026-10-01" } });
    expect(state.project.payload.selectedFlowers[0].availability).toBe("unknown");
  });
});
