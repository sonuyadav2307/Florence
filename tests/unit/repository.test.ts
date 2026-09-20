import { describe, expect, it } from "vitest";
import { MemoryProjectRepository, RepositoryError } from "@/lib/repositories/memory";
import { createGardenDinnerProject, createForeignProject } from "@/data/demo/project";
import { DEMO_EDITOR, DEMO_FOREIGN, DEMO_VIEWER } from "@/lib/repositories/local-demo";
import { toPresentation } from "@/lib/concept/presentation";

describe("repository permissions and saves", () => {
  it("SEC 01 hides projects from another workspace", () => {
    const repo = new MemoryProjectRepository([
      createGardenDinnerProject(),
      createForeignProject(),
    ]);
    expect(() => repo.get(DEMO_EDITOR, "foreign-project")).toThrowError(
      RepositoryError,
    );
    try {
      repo.get(DEMO_EDITOR, "foreign-project");
    } catch (error) {
      expect((error as RepositoryError).code).toBe("NOT_FOUND");
    }
    expect(repo.list(DEMO_FOREIGN, {}).some((item) => item.id === "demo-garden-dinner")).toBe(false);
  });

  it("SEC 02 rejects viewer mutations", () => {
    const repo = new MemoryProjectRepository([createGardenDinnerProject()]);
    expect(() =>
      repo.save(DEMO_VIEWER, "demo-garden-dinner", { expectedVersion: 1 }),
    ).toThrowError(/Viewers/);
  });

  it("SAV 02 returns a conflict on a stale version", () => {
    const repo = new MemoryProjectRepository([createGardenDinnerProject()]);
    repo.save(DEMO_EDITOR, "demo-garden-dinner", {
      expectedVersion: 1,
      name: "Garden Dinner updated",
    });
    try {
      repo.save(DEMO_EDITOR, "demo-garden-dinner", {
        expectedVersion: 1,
        name: "Stale",
      });
      throw new Error("expected conflict");
    } catch (error) {
      expect((error as RepositoryError).code).toBe("VERSION_CONFLICT");
      expect((error as RepositoryError).currentVersion).toBe(2);
    }
  });

  it("duplicate copies design choices without practical confirmations", () => {
    const original = createGardenDinnerProject();
    original.payload.selectedFlowers[0].availability = "confirmed";
    original.payload.selectedFlowers[0].practicalChecks[0].status = "reviewed";
    const repo = new MemoryProjectRepository([original]);
    const copy = repo.duplicate(DEMO_EDITOR, original.id, 1);
    expect(copy.name).toBe("Garden Dinner Copy");
    expect(copy.id).not.toBe(original.id);
    expect(copy.payload.selectedFlowers[0].id).not.toBe(
      original.payload.selectedFlowers[0].id,
    );
    expect(copy.payload.selectedFlowers[0].availability).toBe("unknown");
    expect(copy.payload.selectedFlowers[0].practicalChecks[0].status).toBe(
      "needsReview",
    );
  });
});

describe("presentation projection", () => {
  it("EXP 02 omits internal notes", () => {
    const project = createGardenDinnerProject();
    const presentation = toPresentation(project);
    expect(JSON.stringify(presentation)).not.toContain(project.payload.brief.internalNotes);
    expect(JSON.stringify(presentation)).not.toContain("demo-garden-dinner");
  });
});
