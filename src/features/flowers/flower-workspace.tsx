"use client";

import { useMemo, useState } from "react";
import { FLOWER_CATALOG } from "@/data/demo/catalog";
import { FlowerPlaceholder } from "@/components/flower-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "@/features/palette/editor-provider";
import {
  combinationAdvice,
  needsFoliage,
  rankCandidates,
  visualFitLabel,
} from "@/lib/matching";
import { nearestPaletteSwatch } from "@/lib/matching/rank";
import type { FlowerRole, FlowerVariant } from "@/lib/types";
import { applyPrimaryDialog } from "./use-as-primary";

const ROLES: Array<FlowerRole | "all"> = [
  "all",
  "focal",
  "support",
  "filler",
  "line",
  "foliage",
];

export function FlowerWorkspace({
  libraryMode = false,
}: {
  libraryMode?: boolean;
}) {
  const { state, dispatch } = useEditor();
  const [detail, setDetail] = useState<FlowerVariant | null>(null);
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const availabilityByVariant = Object.fromEntries(
    state.project.payload.selectedFlowers.map((flower) => [
      flower.variantId,
      flower.availability,
    ]),
  );
  const ranked = useMemo(
    () =>
      rankCandidates({
        catalog: FLOWER_CATALOG,
        swatches: state.project.payload.palette.swatches,
        selected: state.project.payload.selectedFlowers,
        eventStyle: state.project.payload.brief.style,
        filters: state.filters,
        availabilityByVariant,
      }),
    [state.project, state.filters, availabilityByVariant],
  );
  const advice = combinationAdvice(
    state.project.payload.selectedFlowers,
    FLOWER_CATALOG,
  );
  const activeFilters = [
    state.filters.query && `“${state.filters.query}”`,
    state.filters.role !== "all" && state.filters.role,
    state.filters.colorFamily !== "all" && state.filters.colorFamily,
    state.filters.style !== "all" && state.filters.style,
    state.filters.hideUnavailable && "hiding unavailable",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="flower-search">Search flowers</Label>
            <Input
              id="flower-search"
              value={state.filters.query}
              onChange={(event) =>
                dispatch({
                  type: "setFilters",
                  filters: { query: event.target.value },
                })
              }
              placeholder="Common name or variant"
            />
          </div>
          <div>
            <Label htmlFor="role-filter">Role</Label>
            <NativeSelect
              id="role-filter"
              value={state.filters.role}
              onChange={(event) =>
                dispatch({
                  type: "setFilters",
                  filters: { role: event.target.value as typeof state.filters.role },
                })
              }
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "all" ? "All roles" : role}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="family-filter">Color family</Label>
            <NativeSelect
              id="family-filter"
              value={state.filters.colorFamily}
              onChange={(event) =>
                dispatch({
                  type: "setFilters",
                  filters: {
                    colorFamily: event.target.value as typeof state.filters.colorFamily,
                  },
                })
              }
            >
              {["all", "pink", "white", "red", "orange", "purple", "yellow", "blue", "green"].map(
                (family) => (
                  <option key={family} value={family}>
                    {family === "all" ? "All families" : family}
                  </option>
                ),
              )}
            </NativeSelect>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.filters.hideUnavailable}
              onChange={(event) =>
                dispatch({
                  type: "setFilters",
                  filters: { hideUnavailable: event.target.checked },
                })
              }
            />
            Hide confirmed unavailable
          </label>
          {activeFilters.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                dispatch({
                  type: "setFilters",
                  filters: {
                    query: "",
                    role: "all",
                    colorFamily: "all",
                    style: "all",
                    hideUnavailable: false,
                  },
                })
              }
            >
              Clear all
            </Button>
          ) : null}
        </div>
        {ranked.length === 0 ? (
          <Card>
            <p>No flowers match {activeFilters.join(", ") || "the current filters"}.</p>
            <Button
              className="mt-3"
              type="button"
              variant="secondary"
              onClick={() =>
                dispatch({
                  type: "setFilters",
                  filters: {
                    query: "",
                    role: "all",
                    colorFamily: "all",
                    style: "all",
                    hideUnavailable: false,
                  },
                })
              }
            >
              Clear filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ranked.map((item) => {
              const selected = state.project.payload.selectedFlowers.some(
                (flower) => flower.variantId === item.variant.id,
              );
              return (
                <Card key={item.variant.id} className="p-0 overflow-hidden">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setDetail(item.variant)}
                  >
                    <FlowerPlaceholder
                      name={item.variant.variantName}
                      hex={item.variant.approximateHex}
                    />
                  </button>
                  <div className="space-y-2 p-4">
                    <h3 className="text-base font-medium">{item.variant.variantName}</h3>
                    <p className="text-sm text-muted">{visualFitLabel(item.score)}</p>
                    <p className="text-sm text-muted">{item.reasons[0]}</p>
                    <Button
                      type="button"
                      variant={selected ? "secondary" : "primary"}
                      disabled={selected}
                      onClick={() =>
                        dispatch({
                          type: "addFlower",
                          variantId: item.variant.id,
                          role:
                            state.filters.role !== "all" &&
                            item.variant.allowedRoles.includes(state.filters.role)
                              ? state.filters.role
                              : item.variant.allowedRoles[0],
                        })
                      }
                    >
                      {selected ? "Added" : "Add to combination"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <aside className="space-y-4 rounded-[16px] border border-border bg-surface p-4 xl:sticky xl:top-4">
        <h2 className="font-serif text-[22px]">Combination</h2>
        {state.project.payload.selectedFlowers.length === 0 ? (
          <p className="text-sm text-muted">Add flowers to review the combination.</p>
        ) : (
          <ul className="space-y-3">
            {state.project.payload.selectedFlowers.map((flower) => {
              const variant = FLOWER_CATALOG.find((item) => item.id === flower.variantId);
              const nearest = variant
                ? nearestPaletteSwatch(variant, state.project.payload.palette.swatches)
                : null;
              return (
                <li key={flower.id} className="rounded-[10px] border border-border p-3">
                  <p className="font-medium">{flower.snapshot.variantName}</p>
                  <p className="text-sm text-muted">
                    {nearest ? `Nearest ${nearest.name}` : "No close swatch"}
                  </p>
                  <Label htmlFor={`role-${flower.id}`}>Role</Label>
                  <NativeSelect
                    id={`role-${flower.id}`}
                    value={flower.role}
                    onChange={(event) =>
                      dispatch({
                        type: "setFlowerRole",
                        id: flower.id,
                        role: event.target.value as FlowerRole,
                      })
                    }
                  >
                    {(variant?.allowedRoles ?? [flower.role]).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </NativeSelect>
                  <p className="mt-2 text-sm">
                    Availability: {flower.availability}
                  </p>
                  <Button
                    className="mt-2"
                    type="button"
                    variant="ghost"
                    onClick={() => dispatch({ type: "removeFlower", id: flower.id })}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="space-y-2 text-sm text-warning">
          {advice.map((message) => (
            <p key={message}>{message}</p>
          ))}
          {needsFoliage(state.project.payload.selectedFlowers) ? (
            <p>Foliage is optional; browse the foliage role for structure.</p>
          ) : null}
        </div>
      </aside>
    </div>
      <Dialog open={Boolean(detail)} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          {detail ? (
            <>
              <DialogTitle className="font-serif text-[22px]">
                {detail.variantName}
              </DialogTitle>
              <FlowerPlaceholder name={detail.variantName} hex={detail.approximateHex} />
              <p className="mt-3 text-sm">Allowed roles: {detail.allowedRoles.join(", ")}</p>
              <p className="text-sm text-muted">
                Editorial review is {detail.editorialReview}. Practical facts are unknown until a florist records a source.
              </p>
              {detail.imageCredit ? (
                <p className="text-sm text-muted">{detail.imageCredit}</p>
              ) : (
                <p className="text-sm text-muted">Labeled placeholder. Licensed photography is not included yet.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={state.project.payload.selectedFlowers.some(
                    (flower) => flower.variantId === detail.id,
                  )}
                  onClick={() => {
                    dispatch({
                      type: "addFlower",
                      variantId: detail.id,
                      role: detail.allowedRoles[0],
                    });
                    setDetail(null);
                  }}
                >
                  {state.project.payload.selectedFlowers.some(
                    (flower) => flower.variantId === detail.id,
                  )
                    ? "Added"
                    : "Add to combination"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPrimaryOpen(true)}
                >
                  Use as primary color
                </Button>
              </div>
              {detail.id === ranked.find((item) => item.variant.id === detail.id)?.variant.id ? (
                <p className="mt-3 text-sm text-muted">
                  Visual fit {ranked.find((item) => item.variant.id === detail.id)?.score}: color {ranked.find((item) => item.variant.id === detail.id)?.colorFit.toFixed(2)}, role {ranked.find((item) => item.variant.id === detail.id)?.roleFit}, style {ranked.find((item) => item.variant.id === detail.id)?.styleFit}, texture {ranked.find((item) => item.variant.id === detail.id)?.textureFit}
                </p>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {detail ? (
        <PrimaryColorDialog
          open={primaryOpen}
          hex={detail.approximateHex}
          onClose={() => setPrimaryOpen(false)}
        />
      ) : null}
      {!libraryMode ? <PracticalReview /> : null}
    </div>
  );
}

function PracticalReview() {
  const { state, dispatch } = useEditor();
  if (state.project.payload.selectedFlowers.length === 0) return null;
  return (
    <section className="xl:col-span-2 w-full space-y-4">
      <h2 className="font-serif text-[22px]">Practical review</h2>
      <p className="text-sm text-muted">
        These notes stay with your team. They do not change Visual fit.
      </p>
      {state.project.payload.selectedFlowers.map((flower) => (
        <Card key={`practical-${flower.id}`}>
          <h3 className="font-medium">{flower.snapshot.variantName}</h3>
          <Label htmlFor={`avail-${flower.id}`}>Availability</Label>
          <NativeSelect
            id={`avail-${flower.id}`}
            value={flower.availability}
            onChange={(event) => {
              const availability = event.target.value as typeof flower.availability;
              dispatch({
                type: "patchFlower",
                id: flower.id,
                patch: {
                  availability,
                  availabilityContext:
                    availability === "confirmed"
                      ? {
                          eventDate: state.project.payload.brief.eventDate,
                          location: state.project.payload.brief.location,
                          recordedAt: new Date().toISOString(),
                        }
                      : flower.availabilityContext,
                },
              });
            }}
          >
            <option value="unknown">Needs review</option>
            <option value="confirmed">Confirmed</option>
            <option value="unavailable">Unavailable</option>
          </NativeSelect>
          <Label className="mt-3" htmlFor={`avail-note-${flower.id}`}>
            Availability source note
          </Label>
          <Textarea
            id={`avail-note-${flower.id}`}
            maxLength={500}
            value={flower.availabilityNote}
            onChange={(event) =>
              dispatch({
                type: "patchFlower",
                id: flower.id,
                patch: { availabilityNote: event.target.value.slice(0, 500) },
              })
            }
          />
          {flower.practicalChecks.map((check) => (
            <div key={check.kind} className="mt-3">
              <Label htmlFor={`${flower.id}-${check.kind}`}>{check.kind}</Label>
              <NativeSelect
                id={`${flower.id}-${check.kind}`}
                value={check.status}
                onChange={(event) =>
                  dispatch({
                    type: "patchFlower",
                    id: flower.id,
                    patch: {
                      practicalChecks: flower.practicalChecks.map((item) =>
                        item.kind === check.kind
                          ? {
                              ...item,
                              status: event.target.value as typeof item.status,
                            }
                          : item,
                      ),
                    },
                  })
                }
              >
                <option value="needsReview">Needs review</option>
                <option value="reviewed">Reviewed</option>
              </NativeSelect>
              <Textarea
                className="mt-2"
                maxLength={500}
                value={check.note}
                onChange={(event) =>
                  dispatch({
                    type: "patchFlower",
                    id: flower.id,
                    patch: {
                      practicalChecks: flower.practicalChecks.map((item) =>
                        item.kind === check.kind
                          ? { ...item, note: event.target.value.slice(0, 500) }
                          : item,
                      ),
                    },
                  })
                }
              />
            </div>
          ))}
        </Card>
      ))}
    </section>
  );
}

function PrimaryColorDialog({
  open,
  hex,
  onClose,
}: {
  open: boolean;
  hex: string;
  onClose: () => void;
}) {
  const { state, dispatch } = useEditor();
  const primary = state.project.payload.palette.swatches.find(
    (swatch) => swatch.role === "primary",
  )!;
  const [unlock, setUnlock] = useState(false);
  const preview = applyPrimaryDialog(
    state.project.payload.palette.swatches,
    hex,
    state.project.payload.palette.mode,
    unlock,
  );
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle className="font-serif text-[22px]">Use as primary color</DialogTitle>
        <p className="mt-2 text-sm text-muted">
          Applying this color sets the primary swatch and regenerates unlocked colors. Selected flowers stay in place.
        </p>
        <div className="mt-4 flex h-8 overflow-hidden rounded-full">
          {preview.swatches.map((swatch) => (
            <span key={swatch.id} className="flex-1" style={{ background: swatch.hex }} />
          ))}
        </div>
        {primary.locked ? (
          <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={unlock}
              onChange={(event) => setUnlock(event.target.checked)}
            />
            Unlock primary so this color can be applied
          </label>
        ) : null}
        <Button
          className="mt-4"
          type="button"
          disabled={primary.locked && !unlock}
          onClick={() => {
            dispatch({
              type: "applyPrimaryFromFlower",
              hex,
              unlockPrimary: unlock,
            });
            onClose();
          }}
        >
          Apply
        </Button>
      </DialogContent>
    </Dialog>
  );
}
