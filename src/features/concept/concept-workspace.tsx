"use client";

import { Card } from "@/components/ui/card";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { useEditor } from "@/features/palette/editor-provider";
import { FlowerPlaceholder } from "@/components/flower-placeholder";
import { stationeryContrastFlags, swatchLabelColor } from "@/lib/color";
import type { ElementKey } from "@/lib/types";

const ELEMENT_LABELS: Record<ElementKey, string> = {
  backdrop: "Backdrop",
  linen: "Linen",
  floralEmphasis: "Floral emphasis",
  stationery: "Stationery",
  accents: "Accent details",
};

export function ConceptWorkspace() {
  const { state, dispatch } = useEditor();
  const { payload } = state.project;
  const swatchById = Object.fromEntries(
    payload.palette.swatches.map((swatch) => [swatch.id, swatch]),
  );
  const stationery = payload.elements.find((element) => element.key === "stationery");
  const stationerySwatch = stationery ? swatchById[stationery.swatchId] : undefined;
  const contrast = stationerySwatch
    ? stationeryContrastFlags(stationerySwatch.hex)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-serif text-[36px] leading-tight max-md:text-[28px]">
          {state.project.name}
        </h2>
        <p className="text-muted">
          {[payload.brief.eventDate || "Date not set", payload.brief.location, payload.brief.style]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>
      <section>
        <h3 className="font-serif text-[22px]">Color palette</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          {payload.palette.swatches.map((swatch) => (
            <div key={swatch.id} className="overflow-hidden rounded-[16px] border border-border">
              <div
                className="h-20 p-3 text-sm"
                style={{ background: swatch.hex, color: swatchLabelColor(swatch.hex) }}
              >
                {swatch.name}
              </div>
              <p className="px-3 py-2 text-sm">
                {swatch.hex} · {swatch.proportion}%
              </p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="font-serif text-[22px]">Flower selection</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {payload.selectedFlowers.map((flower) => (
            <Card key={flower.id} className="p-0 overflow-hidden">
              <FlowerPlaceholder
                name={flower.snapshot.variantName}
                hex={flower.snapshot.approximateHex}
              />
              <p className="p-3 text-sm">
                {flower.snapshot.variantName}
                <span className="block capitalize text-muted">{flower.role}</span>
              </p>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h3 className="font-serif text-[22px]">Event elements</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {payload.elements.map((element) => (
            <Card key={element.key}>
              <Label htmlFor={element.key}>{ELEMENT_LABELS[element.key]}</Label>
              <NativeSelect
                id={element.key}
                value={element.swatchId}
                onChange={(event) =>
                  dispatch({
                    type: "setElement",
                    key: element.key,
                    swatchId: event.target.value,
                  })
                }
              >
                {payload.palette.swatches.map((swatch) => (
                  <option key={swatch.id} value={swatch.id}>
                    {swatch.name} ({swatch.hex})
                  </option>
                ))}
              </NativeSelect>
              <Input
                className="mt-2"
                maxLength={200}
                placeholder="Material note"
                value={element.materialNote}
                onChange={(event) =>
                  dispatch({
                    type: "setElement",
                    key: element.key,
                    swatchId: element.swatchId,
                    materialNote: event.target.value.slice(0, 200),
                  })
                }
              />
            </Card>
          ))}
        </div>
        {contrast?.normalTextFails ? (
          <p className="mt-3 text-sm text-warning">
            Stationery preview: normal text contrast is below 4.5:1 on this color.
          </p>
        ) : null}
      </section>
      <section>
        <h3 className="font-serif text-[22px]">Color placement preview</h3>
        <TablePreview
          fills={Object.fromEntries(
            payload.elements.map((element) => [
              element.key,
              swatchById[element.swatchId]?.hex ?? "#ffffff",
            ]),
          )}
        />
      </section>
      <section>
        <Label htmlFor="presentation-notes">Client-facing notes</Label>
        <Textarea
          id="presentation-notes"
          maxLength={2000}
          value={payload.presentationNotes}
          onChange={(event) =>
            dispatch({ type: "setPresentationNotes", notes: event.target.value })
          }
        />
        <p className="mt-1 text-sm text-muted">
          {payload.presentationNotes.length}/2000
        </p>
      </section>
    </div>
  );
}

function TablePreview({ fills }: { fills: Record<string, string> }) {
  return (
    <div className="mt-3 max-w-md rounded-[16px] border border-border p-4">
      <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Color placement preview">
        <rect width="320" height="200" fill={fills.backdrop ?? "#f4efe7"} />
        <rect x="40" y="40" width="240" height="140" rx="8" fill={fills.linen ?? "#ffffff"} />
        <circle cx="160" cy="90" r="28" fill={fills.floralEmphasis ?? "#d8a7b1"} />
        <rect x="70" y="140" width="70" height="18" fill={fills.stationery ?? "#f4efe7"} />
        <rect x="200" y="56" width="18" height="18" fill={fills.accents ?? "#8b4d65"} />
      </svg>
      <p className="mt-2 text-sm text-muted">Color placement preview</p>
    </div>
  );
}
