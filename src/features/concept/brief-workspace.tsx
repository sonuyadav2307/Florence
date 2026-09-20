"use client";

import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { useEditor } from "@/features/palette/editor-provider";
import type { EventEnvironment, EventStyle, EventType } from "@/lib/types";

export function BriefWorkspace() {
  const { state, dispatch } = useEditor();
  const brief = state.project.payload.brief;
  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={(event) => event.preventDefault()}>
      <h2 className="font-serif text-[22px]">Event brief</h2>
      <Label htmlFor="event-name">Event name</Label>
      <Input
        id="event-name"
        value={state.project.name}
        onChange={(event) => dispatch({ type: "setName", name: event.target.value })}
      />
      <Label htmlFor="client-name">Client display name</Label>
      <Input
        id="client-name"
        maxLength={150}
        value={brief.clientDisplayName}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { clientDisplayName: event.target.value.slice(0, 150) },
          })
        }
      />
      <Label htmlFor="event-type">Event type</Label>
      <NativeSelect
        id="event-type"
        value={brief.eventType}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { eventType: event.target.value as EventType },
          })
        }
      >
        {["wedding", "corporate", "birthday", "social", "other"].map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </NativeSelect>
      <Label htmlFor="event-date">Date</Label>
      <Input
        id="event-date"
        type="date"
        value={brief.eventDate ?? ""}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { eventDate: event.target.value || null },
          })
        }
      />
      <Label htmlFor="location">Location</Label>
      <Input
        id="location"
        maxLength={150}
        value={brief.location}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { location: event.target.value.slice(0, 150) },
          })
        }
      />
      <Label htmlFor="environment">Environment</Label>
      <NativeSelect
        id="environment"
        value={brief.environment}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { environment: event.target.value as EventEnvironment },
          })
        }
      >
        {["indoor", "outdoor", "mixed", "unknown"].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      <Label htmlFor="style">Style</Label>
      <NativeSelect
        id="style"
        value={brief.style ?? ""}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: {
              style: (event.target.value || null) as EventStyle | null,
            },
          })
        }
      >
        <option value="">Not set</option>
        {["romantic", "garden", "modern", "classic", "vibrant"].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      <Label htmlFor="internal-notes">Internal notes</Label>
      <Textarea
        id="internal-notes"
        maxLength={4000}
        value={brief.internalNotes}
        onChange={(event) =>
          dispatch({
            type: "updateBrief",
            brief: { internalNotes: event.target.value.slice(0, 4000) },
          })
        }
      />
    </form>
  );
}
