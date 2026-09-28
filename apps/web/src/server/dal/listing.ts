import "server-only";
import { inArray } from "drizzle-orm";
import { amenities, db, listingAmenities, listings } from "@kotzoeker/db";
import { toCents, type ListingDraftInput } from "@kotzoeker/shared";

type AmenityInput = NonNullable<ListingDraftInput["amenities"]>;

export async function amenitiesAreValid(chosen: AmenityInput) {
  if (chosen.length === 0) return true;
  const rows = await db
    .select({ key: amenities.key, shareable: amenities.shareable })
    .from(amenities)
    .where(
      inArray(
        amenities.key,
        chosen.map((a) => a.key),
      ),
    );
  const shareable = new Map(rows.map((r) => [r.key, r.shareable]));
  return chosen.every(
    (a) => shareable.has(a.key) && (!a.isShared || shareable.get(a.key)),
  );
}

export async function insertListing(
  landlordId: string,
  input: ListingDraftInput,
): Promise<string> {
  const { amenities: chosen = [], rentEuro, costsEuro, ...fields } = input;

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(listings)
      .values({
        ...fields,
        landlordId,
        rentCents: toCents(rentEuro),
        costsCents: costsEuro === undefined ? undefined : toCents(costsEuro),
      })
      .returning({ id: listings.id });

    if (chosen.length > 0) {
      await tx.insert(listingAmenities).values(
        chosen.map((a) => ({
          listingId: row!.id,
          amenityKey: a.key,
          isShared: a.isShared,
          sharedWith: a.isShared ? (a.sharedWith ?? null) : null,
        })),
      );
    }
    return row!.id;
  });
}
