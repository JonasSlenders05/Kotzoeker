import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import {
  amenities,
  db,
  listingAmenities,
  listingPhotos,
  listings,
} from "@kotzoeker/db";
import {
  ListingPublishable,
  toCents,
  toEuro,
  type AmenityOptionDto,
  type ListingCardDto,
  type ListingDraftInput,
  type ListingEditDto,
  type ListingPhotoDto,
  type ListingStatus,
  type PublicListingDto,
} from "@kotzoeker/shared";
import { photoUrl, thumbUrl } from "@/lib/photo-urls";
import { findPhotosOfListing } from "./photos";

type ListingRow = typeof listings.$inferSelect;
type AmenityInput = NonNullable<ListingDraftInput["amenities"]>;
type AmenityRow = {
  amenityKey: string;
  isShared: boolean;
  sharedWith: number | null;
};
type PublicAmenityRow = AmenityRow & { label: string; shareable: boolean };

function toColumns(input: ListingDraftInput) {
  return {
    type: input.type, // undefined = standaardwaarde (nieuw) of ongewijzigd (bijwerken)
    title: input.title,
    description: input.description ?? null,
    rentCents: toCents(input.rentEuro),
    costsCents: toCents(input.costsEuro ?? 0),
    costsIncluded: input.costsIncluded ?? false,
    depositCents:
      input.depositEuro === undefined ? null : toCents(input.depositEuro),
    sizeM2: input.sizeM2 ?? null,
    street: input.street,
    houseNumber: input.houseNumber,
    box: input.box ?? null,
    postalCode: input.postalCode,
    city: input.city,
    availableFrom: input.availableFrom ?? null,
    leaseType: input.leaseType,
    minLeaseMonths: input.minLeaseMonths ?? null,
    hasConformityCertificate: input.hasConformityCertificate ?? false,
    epcLabel: input.epcLabel ?? null,
  };
}

function toAmenityRows(listingId: string, chosen: AmenityInput) {
  return chosen.map((a) => ({
    listingId,
    amenityKey: a.key,
    isShared: a.isShared,
    sharedWith: a.isShared ? (a.sharedWith ?? null) : null,
  }));
}

function toFormValues(
  row: ListingRow,
  chosen: AmenityRow[],
): ListingDraftInput {
  return {
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    rentEuro: toEuro(row.rentCents),
    costsEuro: toEuro(row.costsCents),
    costsIncluded: row.costsIncluded,
    depositEuro:
      row.depositCents === null ? undefined : toEuro(row.depositCents),
    sizeM2: row.sizeM2 ?? undefined,
    street: row.street,
    houseNumber: row.houseNumber,
    box: row.box ?? undefined,
    postalCode: row.postalCode,
    city: row.city,
    availableFrom: row.availableFrom ?? undefined,
    leaseType: row.leaseType,
    minLeaseMonths: row.minLeaseMonths ?? undefined,
    hasConformityCertificate: row.hasConformityCertificate,
    epcLabel: (row.epcLabel ?? undefined) as ListingDraftInput["epcLabel"],
    amenities: chosen.map((a) => ({
      key: a.amenityKey,
      isShared: a.isShared,
      sharedWith: a.sharedWith ?? undefined,
    })),
  };
}

function toPublicListingDto(
  row: ListingRow & { slug: string },
  photos: ListingPhotoDto[],
  chosen: PublicAmenityRow[],
): PublicListingDto {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type,
    rentCents: row.rentCents,
    costsCents: row.costsCents,
    costsIncluded: row.costsIncluded,
    depositCents: row.depositCents,
    sizeM2: row.sizeM2,
    street: row.street,
    postalCode: row.postalCode,
    city: row.city,
    availableFrom: row.availableFrom,
    leaseType: row.leaseType,
    minLeaseMonths: row.minLeaseMonths,
    epcLabel: row.epcLabel,
    hasConformityCertificate: row.hasConformityCertificate,
    coverUrl: cover ? photoUrl(cover.storagePath) : null,
    photos: photos.map((p) => ({
      url: photoUrl(p.storagePath),
      thumbUrl: thumbUrl(p.storagePath),
      altText: null,
      width: p.width,
      height: p.height,
    })),
    amenities: chosen.map((a) => ({
      key: a.amenityKey,
      label: a.label,
      shareable: a.shareable,
      isShared: a.isShared,
      sharedWith: a.sharedWith,
    })),
  };
}

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accenten weg: "é" → "e"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "kot"}-${crypto.randomUUID().slice(0, 6)}`;
}

function ownedBy(landlordId: string, listingId: string) {
  return and(eq(listings.id, listingId), eq(listings.landlordId, landlordId));
}
async function findAmenityRows(listingId: string): Promise<AmenityRow[]> {
  return db
    .select({
      amenityKey: listingAmenities.amenityKey,
      isShared: listingAmenities.isShared,
      sharedWith: listingAmenities.sharedWith,
    })
    .from(listingAmenities)
    .where(eq(listingAmenities.listingId, listingId));
}

// ---------- voorzieningen ----------

export async function findAmenityOptions(): Promise<AmenityOptionDto[]> {
  const rows = await db
    .select()
    .from(amenities)
    .orderBy(asc(amenities.labelNl));
  return rows.map((r) => ({
    key: r.key,
    label: r.labelNl,
    category: r.category,
    shareable: r.shareable,
  }));
}

/** Bestaat elke voorziening, en is "gedeeld" wel toegelaten? */
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
  const unique = new Set(chosen.map((a) => a.key)).size === chosen.length; // twee keer dezelfde key breekt de primary key
  return (
    unique &&
    chosen.every(
      (a) => shareable.has(a.key) && (!a.isShared || shareable.get(a.key)),
    )
  );
}

// ---------- kotbaas ----------

/** Maakt een draft aan voor deze kotbaas en geeft het id terug. */
export async function insertListing(
  landlordId: string,
  input: ListingDraftInput,
): Promise<string> {
  const chosen = input.amenities ?? [];

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(listings)
      .values({ ...toColumns(input), landlordId })
      .returning({ id: listings.id });

    if (chosen.length > 0) {
      await tx.insert(listingAmenities).values(toAmenityRows(row!.id, chosen));
    }
    return row!.id;
  });
}

/** false = het kot bestaat niet of is niet van deze kotbaas. */
export async function updateListing(
  landlordId: string,
  listingId: string,
  input: ListingDraftInput,
): Promise<boolean> {
  const chosen = input.amenities; // undefined = voorzieningen niet aanraken

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(listings)
      .set(toColumns(input))
      .where(ownedBy(landlordId, listingId))
      .returning({ id: listings.id });
    if (updated.length === 0) return false;

    if (chosen) {
      await tx
        .delete(listingAmenities)
        .where(eq(listingAmenities.listingId, listingId));
      if (chosen.length > 0) {
        await tx
          .insert(listingAmenities)
          .values(toAmenityRows(listingId, chosen));
      }
    }
    return true;
  });
}

export async function findListingStatus(
  landlordId: string,
  listingId: string,
): Promise<ListingStatus | null> {
  const [row] = await db
    .select({ status: listings.status })
    .from(listings)
    .where(ownedBy(landlordId, listingId));
  return row?.status ?? null;
}

export async function findListingForEdit(
  landlordId: string,
  listingId: string,
): Promise<ListingEditDto | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(ownedBy(landlordId, listingId));
  if (!row) return null;

  const [chosen, photos] = await Promise.all([
    findAmenityRows(row.id),
    findPhotosOfListing(row.id),
  ]);
  return {
    id: row.id,
    status: row.status,
    slug: row.slug,
    values: toFormValues(row, chosen),
    photos,
  };
}

export async function findListingsByLandlord(
  landlordId: string,
): Promise<ListingCardDto[]> {
  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
      slug: listings.slug,
      city: listings.city,
      rentCents: listings.rentCents,
      updatedAt: listings.updatedAt,
      coverPath: listingPhotos.storagePath,
    })
    .from(listings)
    .leftJoin(
      listingPhotos,
      and(
        eq(listingPhotos.listingId, listings.id),
        eq(listingPhotos.isCover, true),
      ),
    )
    .where(eq(listings.landlordId, landlordId))
    .orderBy(desc(listings.updatedAt));

  return rows.map(({ coverPath, updatedAt, ...rest }) => ({
    ...rest,
    coverThumbUrl: coverPath ? thumbUrl(coverPath) : null,
    updatedAt: updatedAt.toISOString(),
  }));
}

export async function publishListing(
  landlordId: string,
  listingId: string,
): Promise<"ok" | "not_found" | "invalid" | "no_photos"> {
  const [row] = await db
    .select()
    .from(listings)
    .where(ownedBy(landlordId, listingId));
  if (!row) return "not_found";
  if (row.status === "published") return "ok";

  const check = ListingPublishable.safeParse(
    toFormValues(row, await findAmenityRows(listingId)),
  );
  if (!check.success) return "invalid";

  const photoCount = await db.$count(
    listingPhotos,
    eq(listingPhotos.listingId, listingId),
  );
  if (photoCount === 0) return "no_photos";

  const updated = await db
    .update(listings)
    .set({
      status: "published",
      publishedAt: new Date(),
      slug: row.slug ?? makeSlug(row.title), // de slug verandert daarna nooit meer
    })
    .where(ownedBy(landlordId, listingId))
    .returning({ id: listings.id });

  return updated.length > 0 ? "ok" : "not_found";
}

export async function archiveListing(
  landlordId: string,
  listingId: string,
): Promise<boolean> {
  const updated = await db
    .update(listings)
    .set({ status: "archived" })
    .where(ownedBy(landlordId, listingId))
    .returning({ id: listings.id });
  return updated.length > 0;
}

// ---------- publiek ----------
export const getPublishedListingBySlug = cache(
  async (slug: string): Promise<PublicListingDto | null> => {
    const [row] = await db
      .select()
      .from(listings)
      .where(and(eq(listings.slug, slug), eq(listings.status, "published")));
    if (!row?.slug) return null;

    const [photos, chosen] = await Promise.all([
      findPhotosOfListing(row.id),
      db
        .select({
          amenityKey: listingAmenities.amenityKey,
          isShared: listingAmenities.isShared,
          sharedWith: listingAmenities.sharedWith,
          label: amenities.labelNl,
          shareable: amenities.shareable,
        })
        .from(listingAmenities)
        .innerJoin(amenities, eq(amenities.key, listingAmenities.amenityKey))
        .where(eq(listingAmenities.listingId, row.id))
        .orderBy(asc(amenities.category), asc(amenities.labelNl)),
    ]);

    return toPublicListingDto({ ...row, slug: row.slug }, photos, chosen);
  },
);

export async function findPublishedSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  const rows = await db
    .select({ slug: listings.slug, updatedAt: listings.updatedAt })
    .from(listings)
    .where(and(eq(listings.status, "published"), isNotNull(listings.slug)));
  return rows.flatMap((r) =>
    r.slug ? [{ slug: r.slug, updatedAt: r.updatedAt }] : [],
  );
}
