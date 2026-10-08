import { listingPhotos, listings } from "@kotzoeker/db";
import {
    toCents,
    toEuro,
    type ListingDraftInput,
    type ListingPhotoDto,
    type PublicListingDto,
} from "@kotzoeker/shared";

export type ListingRow = typeof listings.$inferSelect;
export type PhotoRow = typeof listingPhotos.$inferSelect;
export type AmenityRow = {
  amenityKey: string;
  isShared: boolean;
  sharedWith: number | null;
};

export type PublicAmenityRow = AmenityRow & {
  label: string;
  shareable: boolean;
};

type AmenityInput = NonNullable<ListingDraftInput["amenities"]>;
export type UrlFor = (storagePath: string) => string;

export const thumbPath = (storagePath: string) =>
  storagePath.replace(/\.webp$/, "_thumb.webp");

export function toColumns(input: ListingDraftInput) {
  return {
    type: input.type,
    title: input.title,
    descreption: input.description ?? null,
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

export function toAmenityRows(listingId: string, chosen: AmenityInput) {
  return chosen.map((a) => ({
    listingId,
    amenityKey: a.key,
    isShared: a.isShared,
    sharedWith: a.isShared ? (a.sharedWith ?? null) : null,
  }));
}

export function toFormValues(
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

export function toListingPhotoDto(
  row: PhotoRow,
  urlFor: UrlFor,
): ListingPhotoDto {
  return {
    id: row.id,
    url: urlFor(row.storagePath),
    thumbUrl: urlFor(thumbPath(row.storagePath)),
    position: row.position,
    isCover: row.isCover,
    width: row.width,
    height: row.height,
  };
}

export function toPublicListingDto(
  row: ListingRow & { slug: string },
  photos: PhotoRow[],
  chosen: PublicAmenityRow[],
  urlFor: UrlFor,
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
    coverUrl: cover ? urlFor(cover.storagePath) : null,
    photos: photos.map((p) => ({
      url: urlFor(p.storagePath),
      thumbUrl: urlFor(thumbPath(p.storagePath)),
      altText: p.altText,
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

export function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenten weg: "é" → "e"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "kot"}-${crypto.randomUUID().slice(0, 6)}`;
}
