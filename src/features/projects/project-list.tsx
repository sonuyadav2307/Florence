"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import {
  duplicateProject,
  getProject,
  listProjects,
  saveProject,
} from "@/features/projects/api";
import { isDemoMode } from "@/lib/config";
import { browserDemoRepository, DEMO_EDITOR } from "@/lib/repositories/local-demo";
import type { ProjectSummary } from "@/lib/types";
import { formatEventDate, formatUpdatedAt } from "@/lib/utils";

function demoQuery(search: string, status: string) {
  return {
    search,
    status: status as "active" | "archived" | "all",
  };
}

export function ProjectList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [items, setItems] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isDemoMode()) {
      setItems(browserDemoRepository().list(DEMO_EDITOR, demoQuery(search, status)));
      return;
    }
    let cancelled = false;
    listProjects(search, status)
      .then((data) => {
        if (!cancelled) {
          setError(null);
          setItems(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, status, tick]);

  if (error) {
    return (
      <div>
        <Header />
        <p className="text-danger">{error}</p>
        <Button className="mt-3" type="button" onClick={() => setTick((value) => value + 1)}>
          Retry
        </Button>
      </div>
    );
  }

  if (!items) {
    return (
      <div>
        <Header />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[16px] bg-brand-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0 && !search && status === "active") {
    return (
      <div>
        <Header />
        <Card className="mt-8 max-w-lg">
          <h2 className="font-serif text-[22px]">Create your first event concept.</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/projects/new">New event</Link>
            </Button>
            {isDemoMode() ? (
              <Button variant="secondary" asChild>
                <Link href="/projects/demo-garden-dinner?tab=palette">View demo</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search events or clients"
          aria-label="Search events"
        />
        <NativeSelect
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            if (!isDemoMode()) {
              setItems(null);
            }
          }}
          aria-label="Filter by status"
          className="md:max-w-xs"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </NativeSelect>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3">
            <Link href={`/projects/${item.id}?tab=palette`} className="block">
              <h2 className="font-serif text-[22px]">{item.name}</h2>
              <p className="text-sm text-muted">
                {formatEventDate(item.eventDate)}
                {item.style ? ` · ${item.style}` : ""}
              </p>
              <div className="mt-3 flex h-4 overflow-hidden rounded-full">
                {item.swatches.map((swatch) => (
                  <span
                    key={swatch.id}
                    className="flex-1"
                    style={{ background: swatch.hex }}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm capitalize text-muted">
                {item.status} · {formatUpdatedAt(item.updatedAt)}
              </p>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const full = await getProject(item.id);
                  const copy = await duplicateProject(item.id, full.version);
                  setTick((value) => value + 1);
                  router.push(`/projects/${copy.id}?tab=palette`);
                }}
              >
                Duplicate
              </Button>
              {item.status === "archived" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const full = await getProject(item.id);
                    await saveProject(item.id, {
                      expectedVersion: full.version,
                      status: "draft",
                    });
                    setTick((value) => value + 1);
                  }}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    const full = await getProject(item.id);
                    await saveProject(item.id, {
                      expectedVersion: full.version,
                      status: "archived",
                    });
                    setTick((value) => value + 1);
                  }}
                >
                  Archive
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[36px] leading-tight max-md:text-[28px]">Projects</h1>
        <p className="text-muted">Build palettes, combinations, and printable concepts.</p>
      </div>
      <Button asChild>
        <Link href="/projects/new">New event</Link>
      </Button>
    </div>
  );
}
