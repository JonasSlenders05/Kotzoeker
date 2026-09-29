// apps/web/src/components/listings/listing-row-actions.tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ListingStatus } from "@kotzoeker/shared";
import { archiveListing, publishListing } from "@/app/dashboard/koten/actions";
import type { ActionResult } from "@/lib/action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = { id: string; status: ListingStatus; slug: string | null };

export function ListingRowActions({ id, status, slug }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/koten/${id}`}>Bewerken</Link>
      </Button>

      {status === "published" && slug && (
        <Button asChild size="sm" variant="ghost">
          <Link href={`/koten/${slug}`}>Bekijken</Link>
        </Button>
      )}

      {status !== "published" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => publishListing(id))}
        >
          Publiceren
        </Button>
      )}

      {status !== "archived" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" disabled={pending}>
              Archiveren
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kot archiveren?</AlertDialogTitle>
              <AlertDialogDescription>
                Het kot verdwijnt van de site. Je kan het later opnieuw
                publiceren.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => archiveListing(id))}>
                Archiveren
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {error && (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
