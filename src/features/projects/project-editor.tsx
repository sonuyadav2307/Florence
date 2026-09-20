"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EditorProvider, useEditor } from "@/features/palette/editor-provider";
import { PaletteWorkspace } from "@/features/palette/palette-workspace";
import { FlowerWorkspace } from "@/features/flowers/flower-workspace";
import { ConceptWorkspace } from "@/features/concept/concept-workspace";
import { BriefWorkspace } from "@/features/concept/brief-workspace";
import { canMarkReady } from "@/lib/validation/project";
import { saveProject } from "@/features/projects/api";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { proportionsNeedNormalize } from "@/features/palette/editor-state";

const TABS = [
  { id: "palette", label: "Palette" },
  { id: "flowers", label: "Flowers" },
  { id: "concept", label: "Concept" },
  { id: "brief", label: "Brief" },
] as const;

export function ProjectEditor({ project }: { project: Project }) {
  return (
    <EditorProvider project={project}>
      <Suspense fallback={<p className="text-muted">Loading event…</p>}>
        <EditorShell />
      </Suspense>
    </EditorProvider>
  );
}

function EditorShell() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, dispatch, saveNow, retry, reloadLatest, saveAsCopy } = useEditor();
  const tab = TABS.some((item) => item.id === params.get("tab"))
    ? params.get("tab")
    : "palette";
  const saveLabel = {
    saved: "Saved",
    unsaved: "Unsaved changes",
    saving: "Saving",
    failed: "Save failed",
    conflict: "Save conflict",
  }[state.saveStatus];

  async function preview() {
    if (state.saveStatus !== "saved") {
      const ok = await saveNow();
      if (!ok) return;
    }
    router.push(`/projects/${state.project.id}/print`);
  }

  return (
    <div className="pb-24 lg:pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Projects
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 font-serif text-[28px] leading-tight md:text-[36px]">
          {state.project.name}
        </h1>
        <p
          className={cn(
            "text-sm",
            state.saveStatus === "failed" || state.saveStatus === "conflict"
              ? "text-danger"
              : "text-muted",
          )}
          aria-live="polite"
        >
          {saveLabel}
        </p>
        {state.saveStatus === "failed" ? (
          <Button type="button" variant="outline" onClick={() => void retry()}>
            Retry
          </Button>
        ) : null}
        <span className="rounded-full bg-brand-soft px-3 py-1 text-sm capitalize text-brand">
          {state.project.status}
        </span>
        <Button type="button" onClick={() => void preview()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Preview concept
        </Button>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/projects/${state.project.id}?tab=${item.id}`}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-[10px] px-4",
              tab === item.id ? "bg-brand text-white" : "bg-brand-soft text-brand",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-6">
        {tab === "palette" ? <PaletteWorkspace /> : null}
        {tab === "flowers" ? <FlowerWorkspace /> : null}
        {tab === "concept" ? <ConceptWorkspace /> : null}
        {tab === "brief" ? <BriefWorkspace /> : null}
      </div>
      <div className="fixed inset-x-0 bottom-0 flex gap-2 border-t border-border bg-surface px-4 py-3 lg:hidden safe-bottom">
        <Button className="flex-1" type="button" onClick={() => void preview()}>
          Preview concept
        </Button>
      </div>
      {canMarkReady(state.project.payload) && state.project.status === "draft" ? (
        <Button
          className="mt-6"
          type="button"
          variant="secondary"
          disabled={proportionsNeedNormalize(state)}
          onClick={() => {
            void saveProject(state.project.id, {
              expectedVersion: state.project.version,
              status: "ready",
              payload: state.project.payload,
              name: state.project.name,
            }).then((saved) => dispatch({ type: "markSaved", project: saved }));
          }}
        >
          Mark ready
        </Button>
      ) : null}
      <div className="sr-only" aria-live="polite">
        {state.liveMessage}
      </div>
      <Dialog open={state.saveStatus === "conflict"}>
        <DialogContent>
          <DialogTitle className="font-serif text-[22px]">
            This event changed in another session.
          </DialogTitle>
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" onClick={() => void reloadLatest()}>
              Reload latest
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const copy = await saveAsCopy();
                if (copy) router.push(`/projects/${copy.id}?tab=palette`);
              }}
            >
              Save my work as a new project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
