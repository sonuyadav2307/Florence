"use client";

import { Copy, Lock, Unlock, Undo2 } from "lucide-react";
import { PALETTE_PRESETS } from "@/data/demo/presets";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { useEditor } from "@/features/palette/editor-provider";
import { allSwatchesLocked, swatchLabelColor } from "@/lib/color";
import { HEX_HELP } from "@/lib/color/constants";
import { proportionsNeedNormalize } from "@/features/palette/editor-state";
import type { Harmony } from "@/lib/types";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const HARMONY_LABELS: Record<Harmony, string> = {
  analogous: "Analogous",
  complementary: "Complementary",
  splitComplementary: "Split complementary",
  triadic: "Triadic",
  monochromatic: "Monochromatic",
};

export function PaletteWorkspace() {
  const { state, dispatch } = useEditor();
  const palette = state.project.payload.palette;
  const selected =
    palette.swatches.find((swatch) => swatch.id === state.selectedSwatchId) ??
    palette.swatches[0];
  const lockedAll = allSwatchesLocked(palette.swatches);
  const proportionTotal = state.proportionDrafts.reduce((sum, value) => sum + value, 0);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetId, setPresetId] = useState(PALETTE_PRESETS[0].id);
  const lockedCount = palette.swatches.filter((swatch) => swatch.locked).length;

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          {palette.swatches.map((swatch) => {
            const label = swatchLabelColor(swatch.hex);
            const isSelected = swatch.id === selected.id;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => dispatch({ type: "selectSwatch", id: swatch.id })}
                className="min-h-24 overflow-hidden rounded-[16px] text-left"
                aria-pressed={isSelected}
                aria-label={`${swatch.name}, ${swatch.hex}, ${swatch.role}, ${swatch.locked ? "locked" : "unlocked"}${isSelected ? ", selected" : ""}`}
              >
                <div
                  className="flex h-28 flex-col justify-between p-3 md:h-36"
                  style={{ background: swatch.hex, color: label }}
                >
                  <span className="text-sm capitalize">{swatch.role}</span>
                  <span className="text-base font-medium">
                    {swatch.name}
                    <span className="block font-mono text-sm">{swatch.hex}</span>
                  </span>
                </div>
                {isSelected ? (
                  <span className="block bg-brand px-3 py-1 text-sm text-white">
                    Selected
                  </span>
                ) : (
                  <span className="block border border-t-0 border-border px-3 py-1 text-sm text-muted">
                    {swatch.locked ? "Locked" : "Unlocked"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">Visual proportions · total {proportionTotal}%</p>
          <div className="flex h-4 overflow-hidden rounded-full border border-border">
            {palette.swatches.map((swatch, index) => (
              <span
                key={swatch.id}
                style={{
                  width: `${Math.max(state.proportionDrafts[index], 0)}%`,
                  background: swatch.hex,
                }}
              />
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            {palette.swatches.map((swatch, index) => (
              <label key={swatch.id} className="text-sm">
                {swatch.role}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={state.proportionDrafts[index]}
                  onChange={(event) =>
                    dispatch({
                      type: "setProportion",
                      index,
                      value: Number(event.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
          {proportionsNeedNormalize(state) ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-danger">
              Proportions must total 100 before this palette can be saved.
              <Button
                type="button"
                variant="secondary"
                onClick={() => dispatch({ type: "normalizeProportions" })}
              >
                Normalize to 100%
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            disabled={lockedAll}
            onClick={() => dispatch({ type: "generate" })}
          >
            Generate alternatives
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={state.history.length === 0}
            onClick={() => dispatch({ type: "undo" })}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Undo
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPresetOpen(true)}>
            Preset gallery
          </Button>
        </div>
        {lockedAll ? (
          <p className="text-sm text-warning">
            All colors are locked, so generation and presets cannot change them.
          </p>
        ) : null}
      </div>
      <aside className="space-y-4 rounded-[16px] border border-border bg-surface p-4 xl:w-[320px]">
        <h2 className="font-serif text-[22px]">Selected swatch</h2>
        <p className="text-sm capitalize text-muted">{selected.role}</p>
        <Label htmlFor="swatch-name">Name</Label>
        <Input
          id="swatch-name"
          value={selected.name}
          maxLength={40}
          onChange={(event) =>
            dispatch({ type: "renameSwatch", name: event.target.value })
          }
        />
        <Label htmlFor="swatch-hex">HEX</Label>
        <div className="flex gap-2">
          <Input
            id="swatch-hex"
            value={state.hexDraft}
            onChange={(event) =>
              dispatch({ type: "draftHex", value: event.target.value })
            }
            onBlur={() => dispatch({ type: "commitHex" })}
            aria-invalid={Boolean(state.hexError)}
            aria-describedby={state.hexError ? "hex-error" : undefined}
          />
          <input
            type="color"
            aria-label="Color picker"
            className="h-11 w-11 cursor-pointer rounded-[10px] border border-control"
            value={selected.hex.toLowerCase()}
            onChange={(event) =>
              dispatch({ type: "commitPicker", hex: event.target.value })
            }
          />
        </div>
        {state.hexError ? (
          <p id="hex-error" className="text-sm text-danger">
            {state.hexError}
          </p>
        ) : (
          <p className="text-sm text-muted">{HEX_HELP}</p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(selected.hex);
              dispatch({ type: "setLive", message: `Copied ${selected.hex}` });
            }}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy HEX
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch({ type: "toggleLock" })}
            aria-pressed={selected.locked}
          >
            {selected.locked ? (
              <Lock className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Unlock className="h-4 w-4" aria-hidden="true" />
            )}
            {selected.locked ? "Locked" : "Unlocked"}
          </Button>
        </div>
        <Label htmlFor="harmony">Harmony mode</Label>
        <NativeSelect
          id="harmony"
          value={palette.mode}
          onChange={(event) =>
            dispatch({ type: "setMode", mode: event.target.value as Harmony })
          }
        >
          {Object.entries(HARMONY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted">{state.explanation}</p>
      </aside>
      <Dialog open={presetOpen} onOpenChange={setPresetOpen}>
        <DialogContent>
          <DialogTitle className="font-serif text-[22px]">Apply a preset</DialogTitle>
          <div className="mt-4 space-y-3">
            {PALETTE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-[10px] border border-border p-3 text-left"
                onClick={() => setPresetId(preset.id)}
                aria-pressed={presetId === preset.id}
              >
                <span className="flex flex-1 flex-col">
                  <span>{preset.name}</span>
                  <span className="flex mt-2 h-4 overflow-hidden rounded-full">
                    {preset.swatches.map((swatch) => (
                      <span
                        key={swatch.role}
                        className="flex-1"
                        style={{ background: swatch.hex }}
                      />
                    ))}
                  </span>
                </span>
              </button>
            ))}
            {lockedCount > 0 ? (
              <p className="text-sm text-warning">
                {lockedCount === 2
                  ? "Two locked colors will stay unchanged"
                  : `${lockedCount} locked color${lockedCount === 1 ? "" : "s"} will stay unchanged`}
              </p>
            ) : null}
            <Button
              type="button"
              disabled={lockedAll}
              onClick={() => {
                dispatch({ type: "applyPreset", presetId });
                setPresetOpen(false);
              }}
            >
              Apply preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
