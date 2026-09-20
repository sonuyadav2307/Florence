"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getProject } from "@/features/projects/api";
import { toPresentation } from "@/lib/concept/presentation";
import { FlowerPlaceholder } from "@/components/flower-placeholder";
import { formatEventDate } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function PrintView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch((err: Error) => setError(err.message));
  }, [projectId]);

  if (error) {
    return <p className="p-8 text-danger">{error}</p>;
  }
  if (!project) {
    return <p className="p-8 text-muted">Loading concept…</p>;
  }

  const concept = toPresentation(project);
  const printed = new Date().toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-sheet mx-auto max-w-[800px] bg-white px-6 py-8 text-[#242B27]">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button type="button" onClick={() => window.print()}>
          Print or save PDF
        </Button>
      </div>
      <h1 className="font-serif text-3xl">Event concept</h1>
      <p className="mt-1 text-sm">
        {concept.title}
        {concept.eventDate ? ` · ${formatEventDate(concept.eventDate)}` : ""}
        {concept.location ? ` · ${concept.location}` : ""}
        {concept.style ? ` · ${concept.style}` : ""}
      </p>
      <section className="mt-6">
        <h2 className="font-serif text-xl">Color palette</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {concept.palette.map((swatch) => (
            <div key={swatch.hex + swatch.role} className="border border-[#bbb]">
              <div className="h-12" style={{ background: swatch.hex }} />
              <p className="px-2 py-1 text-[11pt]">
                {swatch.name}
                <span className="block font-mono">{swatch.hex}</span>
                {swatch.proportion}%
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-xl">Flower selection</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {concept.flowers.map((flower) => (
            <article
              key={flower.variantName + flower.role}
              className="break-inside-avoid border border-[#bbb]"
            >
              <FlowerPlaceholder name={flower.variantName} hex={flower.hex} />
              <p className="p-2 text-[11pt]">
                {flower.variantName}
                <span className="block capitalize">{flower.role}</span>
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-xl">Event elements</h2>
        <ul className="mt-2 text-[11pt]">
          {concept.elements.map((element) => (
            <li key={element.key}>
              {element.key}: {element.colorName} ({element.hex})
              {element.materialNote ? ` · ${element.materialNote}` : ""}
            </li>
          ))}
        </ul>
      </section>
      {concept.presentationNotes ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl">Notes</h2>
          <p className="whitespace-pre-wrap text-[11pt]">{concept.presentationNotes}</p>
        </section>
      ) : null}
      {concept.toConfirm.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl">To confirm</h2>
          <ul className="mt-2 list-disc pl-5 text-[11pt]">
            {concept.toConfirm.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <footer className="mt-8 border-t border-[#bbb] pt-3 text-[10pt]">
        <p>Saved revision {concept.revision} · Printed {printed}</p>
        <p>
          Colors are approximate on screen and in print. Confirm physical samples and flower availability before ordering.
        </p>
      </footer>
    </div>
  );
}
