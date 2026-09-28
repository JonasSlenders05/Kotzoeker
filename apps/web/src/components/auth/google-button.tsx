"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleButton({ next }: { next: string | null }) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function signIn() {
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    startTransition(async () => {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      // Bij succes stuurt Supabase de browser door naar Google.
      if (error) setFailed(true);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signIn}
        disabled={pending}
      >
        Verder met Google
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Inloggen met Google lukte niet. Probeer het opnieuw.
        </p>
      )}
    </div>
  );
}
