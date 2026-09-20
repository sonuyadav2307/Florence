"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FLOWER_CATALOG } from "@/data/demo/catalog";
import { FlowerPlaceholder } from "@/components/flower-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { listProjects, getProject, saveProject } from "@/features/projects/api";
import { generatePalette } from "@/lib/color";
import type { FlowerVariant, ProjectSummary } from "@/lib/types";

export default function FlowerLibraryPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [detail, setDetail] = useState<FlowerVariant | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [chosen, setChosen] = useState("");
  const [unlock, setUnlock] = useState(false);
  const [chooser, setChooser] = useState(false);
  const flowers = useMemo(
    () =>
      FLOWER_CATALOG.filter((item) => {
        const hay = `${item.commonName} ${item.variantName}`.toLowerCase();
        if (query && !hay.includes(query.toLowerCase())) return false;
        if (role !== "all" && !item.allowedRoles.includes(role as never)) return false;
        return true;
      }),
    [query, role],
  );

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight max-md:text-[28px]">Flower library</h1>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search flowers"
          aria-label="Search flowers"
        />
        <NativeSelect value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role">
          {["all", "focal", "support", "filler", "line", "foliage"].map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All roles" : value}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {flowers.map((flower) => (
          <Card key={flower.id} className="overflow-hidden p-0">
            <button type="button" className="block w-full text-left" onClick={() => setDetail(flower)}>
              <FlowerPlaceholder name={flower.variantName} hex={flower.approximateHex} />
              <span className="block p-4">{flower.variantName}</span>
            </button>
          </Card>
        ))}
      </div>
      <Dialog open={Boolean(detail)} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          {detail ? (
            <>
              <DialogTitle className="font-serif text-[22px]">{detail.variantName}</DialogTitle>
              <FlowerPlaceholder name={detail.variantName} hex={detail.approximateHex} />
              <p className="mt-3 text-sm">Roles: {detail.allowedRoles.join(", ")}</p>
              <p className="text-sm text-muted">
                Editorial review is {detail.editorialReview}. No stock, price, or seasonal claim is recorded.
              </p>
              <Button
                className="mt-4"
                type="button"
                onClick={async () => {
                  setProjects(await listProjects("", "active"));
                  setChooser(true);
                }}
              >
                Use as primary color
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={chooser} onOpenChange={setChooser}>
        <DialogContent>
          <DialogTitle className="font-serif text-[22px]">Choose a project</DialogTitle>
          <NativeSelect value={chosen} onChange={(event) => setChosen(event.target.value)}>
            <option value="">Select an event</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </NativeSelect>
          <Button
            className="mt-3"
            type="button"
            disabled={!chosen || !detail}
            onClick={async () => {
              if (!chosen || !detail) return;
              const project = await getProject(chosen);
              const primary = project.payload.palette.swatches.find((swatch) => swatch.role === "primary")!;
              if (primary.locked && !unlock) return;
              const swatches = project.payload.palette.swatches.map((swatch) =>
                swatch.role === "primary"
                  ? { ...swatch, hex: detail.approximateHex, locked: false }
                  : swatch,
              );
              const generated = generatePalette({
                swatches,
                mode: project.payload.palette.mode,
                generationIndex: 0,
              });
              await saveProject(project.id, {
                expectedVersion: project.version,
                payload: {
                  ...project.payload,
                  palette: {
                    ...project.payload.palette,
                    swatches: generated.swatches,
                    generationIndex: generated.nextGenerationIndex,
                  },
                },
              });
              router.push(`/projects/${project.id}?tab=palette`);
            }}
          >
            Continue
          </Button>
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={unlock} onChange={(event) => setUnlock(event.target.checked)} />
            Unlock primary if it is currently locked
          </label>
        </DialogContent>
      </Dialog>
    </div>
  );
}
