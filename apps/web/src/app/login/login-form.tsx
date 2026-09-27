"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function callbackUrl() {
    const url = new URL("/aut/callback", window.location.origin);
    if (next) url.searchParams.set("next", next);
    return url.toString();
  }

  function signInWithGoogle() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });

      if (error) setStatus("error");
    });
  }

  function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: new URL(
            "/auth/callback",
            window.location.origin,
          ).toString(),
        },
      });
      setStatus(error ? "error" : "sent");
    });
  }

  if (status === "sent") {
    return (
      <p>
        Check je mailbox: we stuurden een link naar <strong>{email}</strong>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={pending}
      >
        Verder met Google
      </Button>

      <form onSubmit={sendMagicLink} className="space-y-3">
        <Label htmlFor="email">Of log in met een link per e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Bezig…" : "Stuur me een link"}
        </Button>
      </form>
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Er ging iets mis. Probeer het over een minuutje opnieuw.
        </p>
      )}
    </div>
  );
}
