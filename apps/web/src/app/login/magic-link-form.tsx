"use client";

import { useEffect, useState, useTransition } from "react";
import { MagicLinkSchema } from "@kotzoeker/shared";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COOLDOWN_SECONDS = 60;

export function MagicLinkForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Telt elke seconde af zolang er tijd over is.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function send() {
    const parsed = MagicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Vul een geldig e-mailadres in");
      return;
    }
    setError(null);

    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    startTransition(async () => {
      const { error } = await createClient().auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          shouldCreateUser: false, // registreren gaat enkel via /registreren
          emailRedirectTo: callback.toString(),
        },
      });

      // Enkel te veel pogingen melden we; andere fouten (zoals een onbekend adres) niet,
      // anders verraad je wie een account heeft.
      if (error?.status === 429) {
        setError(
          "Je hebt net een link gevraagd. Wacht even en probeer het opnieuw.",
        );
        return;
      }
      setSent(true);
      setSecondsLeft(COOLDOWN_SECONDS);
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Als er een account bestaat voor <strong>{email}</strong>, staat er nu
          een inloglink in je mailbox. Open hem in deze browser.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={send}
          disabled={pending || secondsLeft > 0}
        >
          {secondsLeft > 0
            ? `Opnieuw versturen (${secondsLeft}s)`
            : "Opnieuw versturen"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
        >
          Ander e-mailadres gebruiken
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="magic-email">E-mailadres</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Bezig…" : "Stuur me een inloglink"}
      </Button>
    </form>
  );
}
