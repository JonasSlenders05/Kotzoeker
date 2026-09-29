// apps/web/src/app/dashboard/koten/photo-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AddPhotoSchema,
  MAX_PHOTOS_PER_LISTING,
  ReorderPhotosSchema,
} from "@kotzoeker/shared";
import { requireRole } from "@/lib/auth";
import type { ActionError, ActionResult } from "@/lib/action-result";
import { thumbPath } from "@/lib/photo-urls";
import { createClient } from "@/lib/supabase/server";
import * as photosDal from "@/server/dal/photos";

const BUCKET = "listing-photos";
const NOT_FOUND: ActionError = {
  ok: false,
  message: "Dit kot of deze foto bestaat niet (meer).",
};

function revalidatePhotos(listingId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/koten/${listingId}`);
  revalidatePath("/koten/[slug]", "page");
}

/** Stap 2 van een upload: de bestanden staan al in Storage, nu de rij in listing_photos. */
export async function addListingPhoto(input: unknown): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const parsed = AddPhotoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige foto." };

  const result = await photosDal.insertPhoto(user.id, parsed.data);
  if (result === "not_found") return NOT_FOUND;
  if (result === "limit") {
    // De bestanden staan al in Storage: ruim ze op, anders blijven ze onzichtbaar achter.
    const path = `${parsed.data.listingId}/${parsed.data.photoId}.webp`;
    const supabase = await createClient();
    await supabase.storage.from(BUCKET).remove([path, thumbPath(path)]);
    return {
      ok: false,
      message: `Maximaal ${MAX_PHOTOS_PER_LISTING} foto's per kot.`,
    };
  }

  revalidatePhotos(parsed.data.listingId);
  return { ok: true };
}

export async function reorderListingPhotos(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const parsed = ReorderPhotosSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Ongeldige volgorde." };

  const { listingId, photoIds } = parsed.data;
  const result = await photosDal.reorderPhotos(user.id, listingId, photoIds);
  if (result === "not_found") return NOT_FOUND;
  if (result === "stale") {
    return {
      ok: false,
      message: "De foto's zijn ondertussen gewijzigd. Herlaad de pagina.",
    };
  }

  revalidatePhotos(listingId);
  return { ok: true };
}

export async function deleteListingPhoto(
  photoId: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const id = z.uuid().safeParse(photoId);
  if (!id.success) return NOT_FOUND;

  // Eerst de rij, dan de bestanden: mislukt stap 2, dan blijft er enkel een onzichtbaar bestand over.
  const result = await photosDal.deletePhoto(user.id, id.data);
  if (!result.ok) {
    if (result.reason === "last_photo") {
      return {
        ok: false,
        message: "Een gepubliceerd kot heeft minstens één foto nodig.",
      };
    }
    return NOT_FOUND;
  }

  // Met de serverclient van de gebruiker: de Storage-policy (slot 2) controleert ook hier de eigenaar.
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([result.storagePath, thumbPath(result.storagePath)]);
  if (error)
    console.error(
      "Fotobestanden niet verwijderd:",
      result.storagePath,
      error.message,
    );

  revalidatePhotos(result.listingId);
  return { ok: true };
}
