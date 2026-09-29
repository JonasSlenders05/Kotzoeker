import "server-only";
import { db, listingPhotos, listings } from "@kotzoeker/db";
import { eq, asc, and, count, max } from "drizzle-orm";
import {
  MAX_PHOTOS_PER_LISTING,
  type AddPhotoInput,
  type ListingPhotoDto,
} from "@kotzoeker/shared";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type PhotoRow = typeof listingPhotos.$inferSelect;

export type DeletePhotoResult =
  | { ok: true; listingId: string; storagePath: string }
  | { ok: false; reason: "not_found" | "last_photo" };

function toListingPhotoDto(row: PhotoRow): ListingPhotoDto {
  return {
    id: row.id,
    storagePath: row.storagePath,
    position: row.position,
    isCover: row.isCover,
    width: row.width,
    height: row.height,
  };
}

async function lockOwnedListing(tx: Tx, landlordId: string, listingId: string) {
  const [row] = await tx
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.landlordId, landlordId)))
    .for("update");
  return row !== undefined;
}

export async function findPhotosOfListing(
  listingId: string,
): Promise<ListingPhotoDto[]> {
  const rows = await db
    .select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(asc(listingPhotos.position));
  return rows.map(toListingPhotoDto);
}

export async function insertPhoto(
  landlordId: string,
  input: AddPhotoInput,
): Promise<"ok" | "not_found" | "limit"> {
  const { listingId, photoId, width, height } = input;
  return db.transaction(async (tx): Promise<"ok" | "not_found" | "limit"> => {
    if (!(await lockOwnedListing(tx, landlordId, listingId)))
      return "not_found";

    const [stats] = await tx
      .select({ total: count(), last: max(listingPhotos.position) })
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, listingId));

    const total = stats?.total ?? 0;
    if (total >= MAX_PHOTOS_PER_LISTING) return "limit";

    await tx
      .insert(listingPhotos)
      .values({
        id: photoId,
        listingId,
        storagePath: `${listingId}/${photoId}.webp`,
        position: (stats?.last ?? -1) + 1,
        isCover: total === 0,
        width,
        height,
      })
      .onConflictDoNothing();
    return "ok";
  });
}

export async function reorderPhotos(
  landlordId: string,
  listingId: string,
  photoIds: string[],
): Promise<"ok" | "not_found" | "stale"> {
  return db.transaction(async (tx): Promise<"ok" | "not_found" | "stale"> => {
    if (!(await lockOwnedListing(tx, landlordId, listingId)))
      return "not_found";

    const existing = await tx
      .select({ id: listingPhotos.id })
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, listingId));
    const known = new Set(existing.map((p) => p.id));

    const sameSet =
      photoIds.length === known.size &&
      new Set(photoIds).size === photoIds.length &&
      photoIds.every((id) => known.has(id));
    if (!sameSet) return "stale";

    for (const [position, id] of photoIds.entries()) {
      await tx
        .update(listingPhotos)
        .set({ position, isCover: position === 0 })
        .where(
          and(eq(listingPhotos.id, id), eq(listingPhotos.listingId, listingId)),
        );
    }
    return "ok";
  });
}

export async function deletePhoto(
  landlordId: string,
  photoId: string,
): Promise<DeletePhotoResult> {
  return db.transaction(async (tx): Promise<DeletePhotoResult> => {
    const [photo] = await tx
      .select({
        listingId: listingPhotos.listingId,
        storagePath: listingPhotos.storagePath,
        isCover: listingPhotos.isCover,
        status: listings.status,
      })
      .from(listingPhotos)
      .innerJoin(listings, eq(listings.id, listingPhotos.listingId))
      .where(
        and(eq(listingPhotos.id, photoId), eq(listings.landlordId, landlordId)),
      );
    if (!photo) return { ok: false, reason: "not_found" };

    if (photo.status === "published") {
      const total = await tx.$count(
        listingPhotos,
        eq(listingPhotos.listingId, photo.listingId),
      );
      if (total <= 1) return { ok: false, reason: "last_photo" };
    }

    await tx.delete(listingPhotos).where(eq(listingPhotos.id, photoId));

    if (photo.isCover) {
      const [next] = await tx
        .select({ id: listingPhotos.id })
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, photo.listingId))
        .orderBy(asc(listingPhotos.position))
        .limit(1);
      if (next)
        await tx
          .update(listingPhotos)
          .set({ isCover: true })
          .where(eq(listingPhotos.id, next.id));
    }

    return {
      ok: true,
      listingId: photo.listingId,
      storagePath: photo.storagePath,
    };
  });
}
