"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { createProject } from "@/features/projects/api";
import type { EventEnvironment, EventType } from "@/lib/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("other");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [environment, setEnvironment] = useState<EventEnvironment>("unknown");
  const [style, setStyle] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const project = await createProject({
        name,
        brief: {
          eventType,
          eventDate: eventDate || null,
          location,
          environment,
          style: (style || null) as never,
        },
      });
      router.push(`/projects/${project.id}?tab=palette`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the event.");
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <h1 className="font-serif text-[36px] leading-tight max-md:text-[28px]">New event</h1>
      <Label htmlFor="name">Event name</Label>
      <Input id="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
      <Label htmlFor="type">Event type</Label>
      <NativeSelect id="type" value={eventType} onChange={(event) => setEventType(event.target.value as EventType)}>
        {["wedding", "corporate", "birthday", "social", "other"].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      <Label htmlFor="date">Date</Label>
      <Input id="date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
      <Label htmlFor="location">Location</Label>
      <Input id="location" maxLength={150} value={location} onChange={(event) => setLocation(event.target.value)} />
      <Label htmlFor="environment">Environment</Label>
      <NativeSelect
        id="environment"
        value={environment}
        onChange={(event) => setEnvironment(event.target.value as EventEnvironment)}
      >
        {["indoor", "outdoor", "mixed", "unknown"].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      <Label htmlFor="style">Style</Label>
      <NativeSelect id="style" value={style} onChange={(event) => setStyle(event.target.value)}>
        <option value="">Not set</option>
        {["romantic", "garden", "modern", "classic", "vibrant"].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit">Create event</Button>
    </form>
  );
}
