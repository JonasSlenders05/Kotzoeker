"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ListingDraft } from "@kotzoeker/shared";
import { requireRole } from "@/lib/auth";
import { amenitiesAreValid, insertListing } from "@/server/dal/listing";

export async function createListing(input: unknown) {
  const user = await requireRole("landlord");

  const parsed = ListingDraft.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (!(await amenitiesAreValid(parsed.data.amenities ?? []))) {
    return {
      ok: false as const,
      message: "Een van de voorzieningen is ongeldig.",
    };
  }

  const listingId = await insertListing(user.id, parsed.data);

  revalidatePath("/dashboard");
  redirect(`/dashboard/koten/${listingId}`);
}
