import { describe, expect, it } from "vitest";
import { FLOWER_CATALOG } from "@/data/demo/catalog";
import { createGardenDinnerProject } from "@/data/demo/project";
import { colorFitOnly, rankCandidates } from "@/lib/matching/rank";
import { combinationAdvice } from "@/lib/matching/advice";

const emptyFilters = {
  query: "",
  role: "all" as const,
  colorFamily: "all" as const,
  style: "all" as const,
  hideUnavailable: false,
};

describe("flower matching", () => {
  it("FLO 01 gives ColorFit 1 for an identical HEX", () => {
    expect(colorFitOnly("#D8A7B1", "#D8A7B1")).toBe(1);
  });

  it("FLO 02 does not invent practical claims for unknown facts", () => {
    const rose = FLOWER_CATALOG.find((item) => item.id === "rose-blush")!;
    expect(rose.catalogData.practicalFacts).toEqual([]);
    expect(rose.editorialReview).toBe("pending");
  });

  it("ranks rose blush highly against Garden Romance", () => {
    const project = createGardenDinnerProject();
    const ranked = rankCandidates({
      catalog: FLOWER_CATALOG,
      swatches: project.payload.palette.swatches,
      selected: [],
      eventStyle: "romantic",
      filters: emptyFilters,
    });
    expect(ranked[0].variant.id).toBe("rose-blush");
    expect(ranked[0].colorFit).toBe(1);
  });

  it("FLO 05 updates advice after removing a focal flower", () => {
    const project = createGardenDinnerProject();
    const withoutFocal = project.payload.selectedFlowers.filter(
      (flower) => flower.role !== "focal",
    );
    const messages = combinationAdvice(withoutFocal, FLOWER_CATALOG);
    expect(messages.some((message) => message.includes("focal"))).toBe(true);
    expect(withoutFocal).toHaveLength(3);
  });
});
