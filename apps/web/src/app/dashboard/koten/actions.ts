// apps/web/src/app/dashboard/koten/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ListingDraft,
  ListingPublishable,
  type ListingDraftInput,
} from "@kotzoeker/shared";
import { requireRole } from "@/lib/auth";
import type { ActionError, ActionResult } from "@/lib/action-result";
import * as listingsDal from "@/server/dal/listing";

const ListingId = z.uuid();
const NOT_FOUND: ActionError = {
  ok: false,
  message: "Dit kot bestaat niet (meer).",
};

/** Valideert de input en controleert de voorzieningen tegen de database. */
async function parseListing(
  input: unknown,
  mustBePublishable: boolean,
): Promise<{ ok: true; data: ListingDraftInput } | ActionError> {
  const parsed = mustBePublishable
    ? ListingPublishable.safeParse(input)
    : ListingDraft.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Controleer de gemarkeerde velden.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  if (!(await listingsDal.amenitiesAreValid(parsed.data.amenities ?? []))) {
    return { ok: false, message: "Een van de voorzieningen is ongeldig." };
  }
  return { ok: true, data: parsed.data };
}

function revalidateListing(listingId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/koten/${listingId}`);
  revalidatePath("/koten/[slug]", "page");
}

export async function createListing(input: unknown): Promise<ActionResult> {
  const user = await requireRole("landlord");

  const parsed = await parseListing(input, false);
  if (!parsed.ok) return parsed;

  const listingId = await listingsDal.insertListing(user.id, parsed.data); // eigenaar nooit uit de input

  revalidatePath("/dashboard");
  redirect(`/dashboard/koten/${listingId}`);
}

export async function updateListing(
  listingId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const id = ListingId.safeParse(listingId);
  if (!id.success) return NOT_FOUND;

  const status = await listingsDal.findListingStatus(user.id, id.data);
  if (!status) return NOT_FOUND;

  // Een kot dat online staat, moet na het opslaan nog altijd volledig zijn.
  const parsed = await parseListing(input, status === "published");
  if (!parsed.ok) return parsed;

  if (!(await listingsDal.updateListing(user.id, id.data, parsed.data)))
    return NOT_FOUND;

  revalidateListing(id.data);
  return { ok: true };
}

export async function publishListing(
  listingId: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const id = ListingId.safeParse(listingId);
  if (!id.success) return NOT_FOUND;

  const result = await listingsDal.publishListing(user.id, id.data);
  if (result === "not_found") return NOT_FOUND;
  if (result === "invalid") {
    return {
      ok: false,
      message:
        "Vul eerst alle verplichte velden in. Open het kot om te zien welke.",
    };
  }
  if (result === "no_photos") {
    return {
      ok: false,
      message: "Voeg minstens één foto toe voor je publiceert.",
    };
  }

  revalidateListing(id.data);
  return { ok: true };
}

export async function archiveListing(
  listingId: unknown,
): Promise<ActionResult> {
  const user = await requireRole("landlord");
  const id = ListingId.safeParse(listingId);
  if (!id.success) return NOT_FOUND;

  if (!(await listingsDal.archiveListing(user.id, id.data))) return NOT_FOUND;

  revalidateListing(id.data);
  return { ok: true };
}
