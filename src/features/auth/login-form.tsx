"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({
  authConfigured,
  nextPath = "/projects",
}: {
  authConfigured: boolean;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: nextPath }),
      });
      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setStatus("error");
        setMessage(body.error?.message || "Could not send a sign-in link.");
        return;
      }
      setStatus("sent");
      setMessage("Check your email for a sign-in link.");
    } catch {
      setStatus("error");
      setMessage("Could not send a sign-in link.");
    }
  }

  if (!authConfigured) {
    return (
      <Card className="mt-8">
        <p className="text-muted">
          Staff sign-in is not configured on this deployment yet. Set the Supabase
          environment variables, or enable demo mode for a local-style preview.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {message ? (
          <p className={status === "error" ? "text-sm text-danger" : "text-sm text-muted"}>
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={status === "sending" || status === "sent"}>
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </Button>
      </form>
    </Card>
  );
}
